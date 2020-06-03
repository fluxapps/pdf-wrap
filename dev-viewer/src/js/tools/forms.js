import {selectedColors} from "../color-pickers";

export class FormsService {

    /**
     *
     * @param {FormsTool} forms
     */
    constructor(forms) {
        this.forms = forms;
        this._rectangleButton = document.getElementById("rectangle-button");
        this._lineButton = document.getElementById("line-button");
        this._circleButton = document.getElementById("circle-button");
        this._ellipseButton = document.getElementById("ellipse-button");
        this._borderSizeInput = document.getElementById("border-size");

        this._rectangleButton.addEventListener("click", () => {
            this.forms.rectangle.borderWith = parseInt(this._borderSizeInput.value);
            this.forms.rectangle.borderColor = selectedColors.border;
            this.forms.rectangle.fillColor = selectedColors.fill;
            this.forms.rectangle.create();
        });

        this._ellipseButton.addEventListener("click", () => {
            this.forms.ellipse.borderWith = parseInt(this._borderSizeInput.value);
            this.forms.ellipse.borderColor = selectedColors.border;
            this.forms.ellipse.fillColor = selectedColors.fill;
            this.forms.ellipse.create({proportional: false});
        });

        this._circleButton.addEventListener("click", () => {
            this.forms.circle.borderWith = parseInt(this._borderSizeInput.value);
            this.forms.circle.borderColor = selectedColors.border;
            this.forms.circle.fillColor = selectedColors.fill;
            this.forms.circle.create();
        });

        this._lineButton.addEventListener("click", () => {
            this.forms.line.borderWith = parseInt(this._borderSizeInput.value);
            this.forms.line.borderColor = selectedColors.border;
            this.forms.line.create();
        });
    }
}

