export default class Gauge {
  constructor({
    arcLength = 360,
    bgColor = "white",
    borderSize = 3,
    fractionLength = 60,
    fractions = [],
    markerLength = 30,
    markerStep = 30,
    maxValue = 360,
    radius = 150,
    value = 0,
    valueFontSize = "2rem",
    wrapperElId = "",
  }) {
    this.arcLength = arcLength;
    this.bgColor = bgColor;
    this.borderSize = borderSize;
    this.fractionLength = fractionLength;
    this.fractions = fractions.map((fraction) => ({
      ...fraction,
      size: parseFloat(fraction.size),
    }));
    this.markerLength = markerLength / 2;
    this.markerStep = markerStep;
    this.maxValue = maxValue;
    this.radius = radius - borderSize / 2;
    this.value = value;
    this.valueFontSize = valueFontSize;
    this.wrapperEl = document.getElementById(wrapperElId);

    this.gaugeEl = document.createElement("div");
    this.gaugeEl.className = "gauge";
    this.gaugeEl.style.setProperty("--bgColor", `${this.bgColor}`);
    this.gaugeEl.style.setProperty("--borderSizePx", `${this.borderSize}px`);
    this.gaugeEl.style.setProperty("--radiusPx", `${this.radius}px`);
    this.gaugeEl.style.setProperty(
      "--markerLengthPx",
      `${this.markerLength}px`
    );
    this.gaugeEl.style.setProperty(
      "--innerCircleDiameterPx",
      `${this.radius * 2 - this.fractionLength}px`
    );
    this.wrapperEl.style.setProperty("--arcLengthDeg", `-${this.arcLength}deg`);

    this.wrapperEl.addEventListener("mousemove", (event) => {
      const fractionIndexOnHover = this.getFractionIndexMouseIsOver(event);

      this.gaugeEl.querySelectorAll(".fraction").forEach((fraction, index) => {
        fraction.style.opacity = fractionIndexOnHover === index ? 1 : 0.5;
      });
    });

    this.gaugeEl.addEventListener("click", (event) => {
      const fractionIndexOnHover = this.getFractionIndexMouseIsOver(event);

      if (this.fractions[fractionIndexOnHover].onClick)
        this.fractions[fractionIndexOnHover].onClick();
    });
  }

  getFractionIndexMouseIsOver(mouseEvent) {
    const cumulativeFractions = this.fractions.map(
      ((sum) => (value) => (sum += value.size))(0)
    );
    const { pageX, pageY } = mouseEvent;
    const x = pageX - this.wrapperEl.offsetLeft - this.radius;
    const y = (pageY - this.wrapperEl.offsetTop - this.radius) * -1;
    const mouseDistanceToCenter = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    const mouseIsInValidRange =
      mouseDistanceToCenter <= this.radius &&
      mouseDistanceToCenter >= this.radius - this.fractionLength / 2;
    const mouseAngle =
      (this.arcLength / 2 +
        90 -
        (Math.atan(y / x) * 180) / Math.PI +
        (x < 0 ? 180 : 0)) %
      360;
    const anglePercent = (mouseAngle * 100) / this.arcLength;
    const activeFractionIndex = cumulativeFractions.findIndex(
      (value) => value > anglePercent
    );
    return mouseIsInValidRange && activeFractionIndex;
  }

  renderFractions() {
    const cumulativeFractions = this.fractions.map(
      ((sum) => (value) => (sum += value.size))(0)
    );
    this.fractions.forEach((fraction, index) => {
      if (fraction.size) {
        const fractionEl = document.createElement("div");
        const fractionAngleDeg = (fraction.size * this.arcLength) / 100;
        const rotation = this.fractions
          .slice(0, index)
          .reduce((acc, cur) => acc + (cur.size * this.arcLength) / 100, 0);

        fractionEl.className = "fraction";
        fractionEl.style.zIndex = 3;
        fractionEl.style.setProperty("--fractionBgColor", fraction.color);
        fractionEl.style.setProperty(
          "--fractionAngleOffsetDeg",
          `${rotation}deg`
        );
        fractionEl.style.setProperty(
          "--fractionAngleDeg",
          `${fractionAngleDeg}deg`
        );
        fractionEl.style.setProperty(
          "--over50",
          fractionAngleDeg > 180 ? 1 : 0
        );
        fractionEl.style.overflow =
          fractionAngleDeg > 180 ? "initial" : "hidden";

        if (!fraction.hideMaxValueText) {
          const maxValueTextEl = document.createElement("div");
          const textEl = document.createElement("div");

          textEl.innerHTML =
            fraction.maxValueText ||
            (cumulativeFractions[index] * this.maxValue) / 100;
          maxValueTextEl.className = "maxValueText";
          maxValueTextEl.appendChild(textEl);
          textEl.style.transform = `rotate(${this.arcLength / 2}deg)`;
          this.wrapperEl.appendChild(maxValueTextEl);

          let angle = (cumulativeFractions[index] * this.arcLength) / 100;
          let radAngle = (angle - 90) * (Math.PI / 180);

          maxValueTextEl.style.zIndex = 3;
          maxValueTextEl.style.transformOrigin = "bottom left";
          maxValueTextEl.style.transform = `
          translate(
            ${this.radius * Math.cos(radAngle)}px,
            ${this.radius * Math.sin(radAngle)}px
          )
          translate(
            ${angle % 360 <= 180 ? maxValueTextEl.offsetWidth : 0}px,
            ${
              (angle % 360 >= 0 && angle % 360 <= 90) ||
              (angle % 360 >= 271 && angle % 360 <= 359)
                ? -maxValueTextEl.offsetHeight
                : 0
            }px
          )
        `;
        }

        this.gaugeEl.append(fractionEl);
      }
    });
    if (this.arcLength < 360) {
      const fractionEl = document.createElement("div");
      const fractionAngleDeg = 360 - this.arcLength - this.borderSize / 3;
      fractionEl.className = "fraction";
      fractionEl.style.setProperty("--fractionBgColor", this.bgColor);
      fractionEl.style.setProperty(
        "--fractionAngleOffsetDeg",
        `${this.arcLength + this.borderSize / 6}deg`
      );
      fractionEl.style.setProperty(
        "--fractionAngleDeg",
        `${fractionAngleDeg}deg`
      );
      fractionEl.style.setProperty("--over50", fractionAngleDeg > 180 ? 1 : 0);
      fractionEl.style.overflow = fractionAngleDeg > 180 ? "initial" : "hidden";
      fractionEl.style.zIndex = 1;
      fractionEl.style.setProperty("--radiusPx", `${this.radius}px`);

      this.wrapperEl.append(fractionEl);
    }
  }

  renderInnerCircle() {
    const innerCircleEl = document.createElement("div");
    innerCircleEl.className = "innerCircle";
    innerCircleEl.style.zIndex = 4;
    this.gaugeEl.appendChild(innerCircleEl);
  }

  renderMarkers() {
    for (let i = 0; i <= this.arcLength / this.markerStep; i++) {
      const angle = i * this.markerStep;
      const radAngle = (angle - 90) * (Math.PI / 180);
      const marker = document.createElement("span");
      marker.className = "marker";
      marker.style.zIndex = 4;
      marker.style.transform = `
        translate(
          ${(this.radius - this.markerLength / 2) * Math.cos(radAngle)}px,
          ${(this.radius - this.markerLength / 2) * Math.sin(radAngle)}px
        )
        rotate(${radAngle}rad)
      `;
      this.gaugeEl.appendChild(marker);
    }
  }

  renderArrow() {
    const arrowEl = document.createElement("div");
    arrowEl.className = "arrowWrapper";
    arrowEl.style.setProperty(
      "--arrowAngleDeg",
      `${(this.arcLength * this.value) / this.maxValue - 90}deg`
    );
    arrowEl.style.zIndex = 4;
    this.gaugeEl.appendChild(arrowEl);
  }

  renderValue() {
    const valueTextEl = document.createElement("div");
    valueTextEl.className = "valueText";
    valueTextEl.innerHTML = this.value;
    valueTextEl.style.setProperty("--valueFontSize", this.valueFontSize);
    valueTextEl.style.zIndex = 4;
    this.gaugeEl.appendChild(valueTextEl);
  }

  render() {
    this.renderFractions();
    this.renderInnerCircle();
    this.renderMarkers();
    this.renderArrow();
    this.renderValue();

    this.wrapperEl.appendChild(this.gaugeEl);
  }

  remove() {
    this.wrapperEl.innerHTML = "";
  }
}
