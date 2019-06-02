export class SidebarManager {

    constructor(pdf) {
        this._pdf = pdf;
        this._outline = pdf.getOutline();

        const pages = []; while (pages.length < pdf.pageCount) pages.push(pages.length + 1);

        this._thumbails = pdf.getThumbnails(96, ...pages);

        this._tableOfContents = document.getElementById("table-of-contents");
        this._thumbnailsUlElement = document.getElementById("thumbnails");
    }

    renderOutline() {

        this._outline.then(outline => {

            this.clearOutline();
            outline.flatList.forEach(it => {

                const li = document.createElement("li");

                li.innerHTML = it.title;
                li.addEventListener("click", () => {
                    this._pdf.currentPageNumber = it.pageNumber;
                });

                this._tableOfContents.appendChild(li);
            });
        });
    }

    renderThumbnails() {

        this.clearThumbnails();
        this._thumbails.subscribe(it => {

            const li = document.createElement("li");
            li.classList.add("center");
            li.classList.add("aligned");

            li.appendChild(it.content);
            li.addEventListener("click", () => {
                this._pdf.currentPageNumber = it.pageNumber;
            });

            this._thumbnailsUlElement.appendChild(li);
        });
    }

    clearThumbnails() {
        while (this._thumbnailsUlElement.lastChild) {
            this._thumbnailsUlElement.removeChild(this._thumbnailsUlElement.lastChild);
        }
    }

    clearOutline() {
        while (this._tableOfContents.lastChild) {
            this._tableOfContents.removeChild(this._tableOfContents.lastChild);
        }
    }
}
