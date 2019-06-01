

// tslint:disable-next-line:no-namespace
declare namespace svgjs {

    import SelectizeOptions = svgjs.select.SelectizeOptions;
    declare namespace select {
        export type PointTypeFunction = (cx: number, cy: number) => void;

        export interface SelectizeOptions {
            readonly deepSelect?: boolean;
            readonly points?: Array<'lt' | 'rt' | 'rb' | 'lb' | 't' | 'r' | 'b' | 'l'>;
            readonly pointsExclude?: Array<'lt' | 'rt' | 'rb' | 'lb' | 't' | 'r' | 'b' | 'l'>;
            readonly classRect?: string;
            readonly classPoints?: string;
            readonly pointSize?: number;
            readonly rotationPoint?: boolean;
            readonly pointType?: "circle" | "rect" | PointTypeFunction;
        }
    }


    export interface Element {
        selectize(select: boolean | SelectizeOptions): this;
        on<T>(event: string, cb: (event: T) => void, context?: object, options?: AddEventListenerOptions | boolean): this;
    }
}

declare module "svg.select.js" {

}
