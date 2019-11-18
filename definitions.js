// @ts-nocheck
z.abstracts = z.define(abstracts => {
	return {
		// DISPATCHES ACTIVATED/DEACTIVATED EVENTS
		Activatable: z.abstract({
			active: z.attribute.boolean(false, (element, from, to) => {
				if (to)
					element.style.display = 'block';
				element.dispatchEvent(z.event(to ? "actived" : "deactived"));
			}),
			transitionend: z.listener(element => {
				if (!element.active)
					element.style.display = 'none';
			})
		}),
		// DISPATCHES UPDATING/UPDATED EVENTS
		Updatable: z.abstract({
			state: z.attribute.options([
				'waiting',
				'updating',
				'updated'
			], ((element, from, to) =>
				element.dispatchEvent(z.event(to))))
		}),
		Enabled: z.abstract({
			enabled: z.attribute.boolean(false),
			ready: z.listener(element => {
				element.enabled = true;
			}),
		}),
		Template: z.abstract({
			template: z.property.type.function(),
			connected: z.listener(element => {
				let markup = element.template(element);
				// remove unnecessary whitespace:
				element.innerHTML = markup
					.replace(/[\s]+</gi, '<')
					.replace(/>[\s]+/gi, '>');
			}),
		}),
		Interval: z.abstract({
			stamp: z.property.type.integer(Date.now()),
			interval: z.property.type.integer(0),
			render: z.listener(element => {
				if (Date.now() - element.stamp >= element.interval) {
					element.stamp = Date.now();
					element.dispatch('interval', {}, false, false);
				}
			}),
		}),
		Icon: z.abstract({
			icon: z.attribute.string("", (element, from, to) => {
				console.log(abstracts.Icon, abstracts.Icon.path);
				element.url = to ? `url("${abstracts.Icon.path + to}.svg")` : "";
			}),
			url: z.css.string(),
		}).static({
			path: z.property.type.string("/assets/icons/"),
		}),
		// List: z.abstract({
		// 	selected: z.attribute.integer(),
		// 	items: z.property.getter(),
		// 	/*
		// 	*/
		// }),
		// Item: z.abstract({
		// 	order: z.property.getter(item => {
		// 		return item.parent.children.indexOf(item);
		// 	}),
		// 	selected: z.attribute.boolean(false, (item, from, to) => {
		// 		if (to)
		// 			item.parent.index = item.order;
		// 	}),
		// 	connected: z.listener((item, event) => {
		// 		item.selected = item.order === 0;
		// 	}),
		// }),
	};
});

z.elements = z.define(elements => {
	const path_match = (url, path) => url === path;

	return {
		"z-element": z.element({}),

		"z-button": z.element({}, z.abstracts.Icon, z.abstracts.Enabled),

		"z-app": z.element({
			name: z.attribute.string().required(),
			views: z.property.getter(element => {
				return element.children.filter(child =>
					z.type.has_interface(child, elements["z-view"]));
			}),
			location: z.attribute.string("", (app, from, to) => {
				app.views.forEach(view => {
					if (view.active = path_match(to, view.path)) {
						history.pushState(view.state || {}, view.title, to);
						app.dispatch('viewchange', {
							view: view
						});
					}
				});
			}),
			ready: z.listener(app => {
				app.location = window.location.pathname;
				app.state = "updated";
			}),
		}),

		"z-view": z.element({
			title: z.attribute.string().required(),
			path: z.attribute.string().required(),
			"@active": z.listener((view, event) => {
				if (event.to) {
					view.state = "updating";
					view.parent.location = view.path;
				}
				// TODO: We should check if resources need to be loaded...
				setTimeout(e => {
					view.state = "updated";
				}, 1250);
			}),
			connected: z.listener(view => {
				view.active = path_match(view.parent.location, view.path)
			}),
		}, z.abstracts.Activatable, z.abstracts.Updatable),

		"z-slideshow": z.element({
			focus: z.css.integer(),
			slide: z.attribute.integer(0, (slideshow, from, to) => {
				slideshow.focus = to;
				slideshow.slides.forEach((slide, index) => {
					console.log(">>>", index);
					slide.active = index === to;
				})
			}),
			slides: z.property.getter(slideshow => {
				return slideshow.children.filter(el =>
					z.type.has_interface(el, elements["z-slide"]))
			}),
			shift(delta, n = this.slide + delta, l = this.slides.length - 1) {
				this.slide = n > l ? 0 : n < 0 ? l : n;
			},
			next() {
				this.shift(1);
			},
			previous() {
				this.shift(-1);
			},
		}),

		"z-slide": z.element({
			order: z.css.integer(),
			offset: z.css.integer(),
			"@active": z.listener((slide, event) => {
				if (event.to)
					slide.parent.slide = slide.order;
				slide.offset = slide.order - slide.parent.slide;
			}),
			connected: z.listener(slide => {
				let index = slide.parent.slides.indexOf(slide);
				slide.order = index;
				slide.active = index === 0;
				slide.offset = index;
			}),
		}, z.abstracts.Activatable)
	};	
});
