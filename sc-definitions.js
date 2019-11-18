// @ts-nocheck
const sc = z.define(sc => {
	return {
		"sc-letter": z.element({
			value: z.attribute.string('', (letter, from, to) => {
				letter.textContent = to;
			})
		}, z.abstracts.Activatable),
		"sc-title": z.element({
			text: z.attribute.string("", title => {
				title.interval = title.random();
				title.state = 'erasing';
			}),
			state: z.attribute.options([
				'erasing',
				'typing',
				'done'
			]),
			interval: z.listener(title => {
				switch (title.state) {
					case "erasing":
						if (title.children.length > 0)
							title.erase();
						else
							title.state = 'typing';
						break;
					case "typing":
						if (title.text.length === title.children.length)
							title.state = 'done';
						else
							title.type();
						break;
					case "done":
						return;
				}
				title.interval = title.random();
			}),
			random() {
				return z.math.random.range(60, 425);
			},
			erase() {
				let letter = this.children.pop();
				letter.parent.removeChild(letter);
			},
			type() {
				this.append(sc['sc-letter']({
					value: this.text[this.children.length]
				}));
			}
		}, z.abstracts.Interval),
		"sc-header": z.element({
			title: z.attribute.string("", (element, from, to) => {
				element.children.filter(el =>
					el.tagName.toLowerCase() === "sc-title")
					.forEach(el => el.text = to);
			}),
			template: z.property.type.function(element => `
				<button style="display:none;">Back</button>
				<sc-title></sc-title>
				<button><img src="/assets/icons/menu.svg" /></button>
			`),
			connected: z.listener(header => {
				header.parent.listen('viewchange', e => {
					header.title = e.view.title;
				});
			}),
		}, z.abstracts.Template),

		"sc-countdown": z.element({
			deadline: z.attribute.date().required(),
			template: z.property.value(element => {
				return `
					<sc-timeunit unit="days"></sc-timeunit>
					<sc-timeunit unit="hours"></sc-timeunit>
					<sc-timeunit unit="minutes"></sc-timeunit>
					<sc-timeunit unit="seconds"></sc-timeunit>
					<sc-timeunit unit="milliseconds"></sc-timeunit>
				`;
			}), // TODO: should be something like z.implement
			connected: z.listener(countdown => {
				countdown.interval = 1000;
			}),
			render: z.listener(countdown => {
				// loop through the results of the span, and associate each one
				// with each child
				let timespan = z.math.time.span(countdown.deadline.getTime() - Date.now());
				let timeunits = countdown.children;
				timeunits.forEach((unit, index) => {
					unit.value = timespan[index];
				});
			}),
		}, z.abstracts.Template),

		"sc-timeunit": z.element({
			value: z.attribute.integer(0, (element, from, to) => {
				let num = element.children[0];
				if (num)
					num.innerHTML = Array.from(((to < 10 ? "0" : "") + to)
						.substr(0, 2)).map(digit => `<span>${digit}</span>`).join('');
			}),
			unit: z.attribute.string(),
			template: z.property.value(element => {
				return `
					<div class="number">
						<span>0</span><span>0</span>
					</div>
					<label>${element.unit}</label>
				`;
			}),
		}, z.abstracts.Template),


		"sc-scene": z.element({}),
		"sc-face": z.element({}),
		"sc-cube": z.element({
			template: z.property.type.function(element => `
				<div class="cube">
					<div class="front"></div>
					<div class="back"></div>
					<div class="top"></div>
					<div class="bottom"></div>
					<div class="left"></div>
					<div class="right"></div>
				</div>
			`),
		}, z.abstracts.Template),
		"sc-starfield": z.element({
			stars: z.attribute.integer().required(),
			connected: z.listener(starfield => {
				for (let i = 0, l = starfield.stars; i < l; i++) {
					starfield.append(sc["sc-star"]({
						x: z.math.random.range(0, 100),
						y: z.math.random.range(0, 100),
						rate: z.math.random.range(20, 100),
						size: z.math.random.range(0.5, 2),
						scale: z.math.random.range(30, 100)
					}));
				}
			})
		}),
		"sc-star": z.element({
			x: z.css.unit.vw(),
			y: z.css.unit.vh(),
			rate: z.css.integer(),
			size: z.css.unit.px(),
			scale: z.css.factor(),
		}),
		"sc-clouds": z.element({}),
		"sc-filter": z.element({}),
	};
});
