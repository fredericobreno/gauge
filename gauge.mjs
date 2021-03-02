export default class Gauge {
  constructor({
    arcLength = 360,
    borderSize = 3,
    fractionLength = 60,
    fractions = [],
    markerLength = 30,
    markerStep = 30,
    radius = 150,
    value = "0%",
    valueFontSize = "2rem",
    valueText = "",
    wrapperElId = "",
  }) {
    this.arcLength = arcLength;
    this.borderSize = borderSize;
    this.fractionLength = fractionLength;
    this.fractions = fractions;
    this.markerLength = markerLength / 2;
    this.markerStep = markerStep;
    this.radius = radius - borderSize / 2;
    this.value = value;
    this.valueFontSize = valueFontSize;
    this.valueText = valueText;
    this.wrapperEl = document.getElementById(wrapperElId);

    this.wrapperEl.className = "indicator";
    this.wrapperEl.style.setProperty("--radiusPx", `${this.radius}px`);
    this.wrapperEl.style.setProperty("--borderSizePx", `${this.borderSize}px`);
    this.wrapperEl.style.setProperty(
      "--markerLengthPx",
      `${this.markerLength}px`
    );
    this.wrapperEl.style.setProperty("--arcLengthDeg", `-${this.arcLength}deg`);
    this.wrapperEl.style.setProperty(
      "--innerCircleDiameterPx",
      `${this.radius * 2 - this.fractionLength}px`
    );

    this.wrapperEl.addEventListener("mousemove", (event) => {
      const fractionIndexOnHover = this.getFractionIndexMouseIsOver(event);

      this.wrapperEl
        .querySelectorAll(".fraction")
        .forEach((fraction, index) => {
          fraction.style.opacity = fractionIndexOnHover === index ? 1 : 0.5;
        });
    });

    this.wrapperEl.addEventListener("click", (event) => {
      const fractionIndexOnHover = this.getFractionIndexMouseIsOver(event);

      if (this.fractions[fractionIndexOnHover].onClick)
        this.fractions[fractionIndexOnHover].onClick();
    });
  }

  getFractionIndexMouseIsOver(mouseEvent) {
    const cumulativeFractions = this.fractions.map(
      ((sum) => (value) => (sum += parseInt(value.size)))(0)
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

  render() {
    // add the fractions
    this.fractions.forEach((fraction, index) => {
      const fractionEl = document.createElement("div");
      const fractionAngleDeg = (parseInt(fraction.size) * this.arcLength) / 100;

      fractionEl.className = "fraction";
      fractionEl.style.setProperty("--fractionBgColor", fraction.color);
      fractionEl.style.setProperty(
        "--fractionAngleOffsetDeg",
        `${this.fractions
          .slice(0, index)
          .reduce(
            (acc, cur) => acc + (parseInt(cur.size) * this.arcLength) / 100,
            0
          )}deg`
      );
      fractionEl.style.setProperty(
        "--fractionAngleDeg",
        `${fractionAngleDeg}deg`
      );
      fractionEl.style.setProperty("--over50", fractionAngleDeg > 180 ? 1 : 0);
      fractionEl.style.overflow = fractionAngleDeg > 180 ? "initial" : "hidden";
      this.wrapperEl.append(fractionEl);
    });

    // add the inner circle
    const innerCircleEl = document.createElement("div");
    innerCircleEl.className = "innerCircle";
    this.wrapperEl.appendChild(innerCircleEl);

    // add the markers
    for (let i = 0; i <= this.arcLength / this.markerStep; i++) {
      const angle = i * this.markerStep;
      const radAngle = (angle - 90) * (Math.PI / 180);
      const marker = document.createElement("span");
      marker.className = "marker";
      marker.style.transform = `
              translate(
                ${(this.radius - this.markerLength / 2) * Math.cos(radAngle)}px,
                ${(this.radius - this.markerLength / 2) * Math.sin(radAngle)}px
              )
              rotate(${radAngle}rad)
            `;
      this.wrapperEl.appendChild(marker);
    }

    const arrowEl = document.createElement("div");
    arrowEl.className = "arrowWrapper";
    arrowEl.style.setProperty(
      "--arrowAngleDeg",
      `${(this.arcLength * parseFloat(this.value)) / 100 - 90}deg`
    );
    this.wrapperEl.appendChild(arrowEl);

    const valueTextEl = document.createElement("div");
    valueTextEl.className = "valueText";
    valueTextEl.innerHTML = this.valueText;
    valueTextEl.style.setProperty("--valueFontSize", this.valueFontSize);
    this.wrapperEl.appendChild(valueTextEl);
  }
}
