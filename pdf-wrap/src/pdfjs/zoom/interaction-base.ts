import { fromEvent, merge, Observable, ReplaySubject, Subject } from "rxjs";
import { bufferCount, filter, map, takeUntil, tap, throttleTime } from "rxjs/operators";
import { Logger } from "typescript-logging";
import { Optional } from "typescript-optional";
import { StateChangeEvent } from "../../api/event";
import { DoubleTapInteraction, ZoomingInteraction } from "../../api/zoom";
import { LoggerFactory } from "../../log-config";
import { DocumentModel, getPageNumberByEvent, Page } from "../document.model";

export abstract class AbstractZoomingInteraction implements ZoomingInteraction {

    readonly #log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/zoom/interaction-base:AbstractZoomingInteraction");
    readonly #stateChange$: ReplaySubject<StateChangeEvent> = new ReplaySubject<StateChangeEvent>(1);
    readonly stateChange: Observable<StateChangeEvent> = this.#stateChange$.asObservable();

    #isEnabled: boolean = false;

    get enabled(): boolean {
        return this.#isEnabled;
    }

    set enabled(value: boolean) {
        if (value === this.#isEnabled) {
            return;
        }

        this.#isEnabled = value;
        this.#log.debug(`Interaction enabled: ${this.#isEnabled} [interaction=${this.constructor.name}]`);
        this.#stateChange$.next(new StateChangeEvent(value));
        if (this.#isEnabled) {
            this.startListenForGesture();
            return;
        }

        this.stopListeningForGesture();
    }

    toggle(): void {
        this.enabled = !this.enabled;
    }

    protected abstract startListenForGesture(): void;
    protected abstract stopListeningForGesture(): void;

    protected dispose(): void {
        this.#stateChange$.complete();
        this.enabled = false;
    }
}

export abstract class AbstractDoubleTapInteraction extends AbstractZoomingInteraction implements DoubleTapInteraction {

    readonly #dispose$: Subject<void> = new Subject<void>();
    readonly #log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/zoom/interaction-base:AbstractDoubleTapInteraction");

    private gestureDelta: number = 500;

    get maxDoubleTapDelta(): number {
        return this.gestureDelta;
    }

    set maxDoubleTapDelta(value: number) {
        this.gestureDelta = Math.ceil(value);
        this.#log.trace(`New double tap gesture delta: ${this.gestureDelta} [interaction=${this.constructor.name}]`);
    }


    protected constructor(private readonly container: DocumentModel) {
        super();
    }

    protected dispose(): void {
        super.dispose();
        this.#dispose$.next();
        this.#dispose$.complete();
    }

    protected startListenForGesture(): void {
        const eventStream: Observable<Optional<Page>> = merge(
            this.listenForDoubleClick(),
            this.listenForDoubleTab()
        ).pipe(
            throttleTime(100),
            map((it) => this.getPageByEvent(it)),
            takeUntil(this.#dispose$)
        );

        this.listenForGesture(eventStream);
    }

    protected abstract listenForGesture(events: Observable<Optional<Page>>): void;

    private getPageByEvent(evt: Event): Optional<Page> {

        try {

            const pageNumber: number | undefined = getPageNumberByEvent(evt);

            this.#log.trace(() => `Gesture occurred on page: ${pageNumber} [event=${evt.type}]`);

            if (pageNumber !== undefined) {
                return Optional.ofNonNull(this.container.getPage(pageNumber));
            }

            return Optional.empty();
        } catch (e) {
            this.#log.info(() => e.message);
            return Optional.empty();
        }
    }

    private listenForDoubleClick(): Observable<Event> {
        return fromEvent<MouseEvent>(this.container.viewer, "dblclick", {passive: true}).pipe(
            takeUntil(this.#dispose$)
        );
    }

    private listenForDoubleTab(): Observable<Event> {
        return fromEvent<TouchEvent>(this.container.viewer, "touchend", {passive: true}).pipe(
            tap((it) => this.#log.trace(`Touches detected: ${it.touches.length}`)),
            filter((it) => it.touches.length === 0),
            bufferCount(2, 1),
            tap((it) => this.#log.trace(
                `Touch interval 1: ${it[0].timeStamp}, 2: ${it[1].timeStamp} diff: ${it[1].timeStamp - it[0].timeStamp} delta: ${this.gestureDelta}`
            )),
            filter((it) => (it[1].timeStamp - it[0].timeStamp) <= this.gestureDelta),
            map((it) => it[1]),
            takeUntil(this.#dispose$)
        );
    }

    protected stopListeningForGesture(): void {
        this.#dispose$.next();
    }
}
