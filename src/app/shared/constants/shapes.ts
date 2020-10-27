export const SHAPE_TYPE1 = ['line', 'line_r', 'line_lr'];
export const SHAPE_TYPE2 = ['rect', 'rect_round', 'rect_quatre', 'rect_oval', 'rect_round_lr'];
export const SHAPE_TYPE3 = ['arrow_r', 'arrow_l', 'arrow_u', 'arrow_d', 'arrow_lr', 'arrow_ud',
		'star_explosion', 'star_8', 'banner', 'banner_flag',
		'callout_round_rect', 'callout_ellipes', 'callout_cloud'];

export const GLOGOOD_SHAPES = {
	line:  {
			path: 'M0 50 L100 50',
			viewBox: '0 0 100 100',
			attributes: {
				'fill': 'black',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
		},
	line_l: {
			path: 'M30 50 L100 50',
			polygons: ['0, 50 30, 0 30, 100'],
			attributes: {
				'fill': 'black',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1 + 1.67,  // The padding of container = tanA * (width or height of container / 100) * stroke_width / 2, preserveAspectRatio="none"
				bottom: 2.67,
				left: 1.6,
				right: 1,
			}
		},
	line_r: {
			path: 'M0 50 L80 50',
			polygons: ['80, 0 100, 50 80, 100'],
			attributes: {
				'fill': 'black',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 2.67,
				bottom: 2.67,
				left: 1,
				right: 1.6,
			}
		},
	line_lr: {
			path: 'M20 50 L80 50',
			polygons: [
				'0, 50 20, 0 20, 100',
				'80, 0 100, 50 80, 100',
			],
			attributes: {
				'fill': 'black',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 2.67,
				bottom: 2.67,
				left: 1,
				right: 1.6,
			}
		},
	arrow_l: {
			polygons: [
				'0, 50 40, 0 40, 30 100, 30 100, 70 40, 70 40, 100',
			],
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 2.25,
				bottom: 2.25,
				left: 1.8,
				right: 1,
			}
		},
	arrow_r: {
			polygons: [
				'0, 30 60, 30 60, 0 100, 50 60, 100 60, 70 0, 70'
			],
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 2.25,
				bottom: 2.25,
				left: 1,
				right: 1.8,
			}
		},
	arrow_lr: {
			polygons: [
				'0, 50 30, 0 30, 30 70, 30 70, 0 100, 50 70, 100 70, 70 30, 70 30, 100'
			],
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 2.25,
				bottom: 2.25,
				left: 1.8,
				right: 1.8,
			}
		},
	arrow_u: {
			polygons: [
				'50, 0 100, 40 70, 40 70, 100 30, 100 30, 40 0, 40'
			],
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1.8,
				bottom: 1,
				left: 2.25,
				right: 2.25,
			}
		},
	arrow_d: {
			polygons: [
				'30, 0 70, 0 70, 60 100, 60 50, 100 0, 60 30, 60'
			],
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1,
				bottom: 1.8,
				left: 2.25,
				right: 2.25,
			}
		},
	arrow_ud: {
			polygons: [
				'50, 0 100, 30 70, 30 70, 70 100, 70 50, 100 0, 70 30, 70 30, 30 0, 30'
			],
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1.8,
				bottom: 1.8,
				left: 2.25,
				right: 2.25,
			}
		},
	rect: {
			attributes: {
				'width': '100%',
				'height': '100%',
				'border-color': 'black',
				'border': '2px',
				'border-style': 'solid'
			}
		},
	rect_round: {
			attributes: {
				'width': '100%',
				'height': '100%',
				'border-color': 'black',
				'border': '2px',
				'border-radius': '10px',
				'border-style': 'solid'
			}
		},
	rect_quatre: {
			attributes: {
				'width': '100%',
				'height': '100%',
				'border-color': 'black',
				'border': '2px',
				'border-top-right-radius': '100%',
				'border-style': 'solid'
			}
		},
	rect_oval: {
			attributes: {
				'width': '100%',
				'height': '100%',
				'border-color': 'black',
				'border': '2px',
				'border-radius': '50%',
				'border-style': 'solid'
			}
		},
	rect_round_lr: {
			attributes: {
				'width': '100%',
				'height': '100%',
				'border-color': 'black',
				'border': '2px',
				'border-top-right-radius': '10px',
				'border-bottom-left-radius': '10px',
				'border-style': 'solid'
			}
		},
	callout_round_rect: {
			path: 'M0 20 q0 -20 20 -20 L80 0 q20 0 20 20 L100 60 q0 20 -20 20 L40 80 L35 100 L30 80 L20 80 q-20 0 -20 -20 Z',
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1,
				bottom: 1.25,
				left: 1,
				right: 1,
			}
		},
	callout_ellipse: {
			path: 'M40 100 L30 70 M30 70 C-20 50 -10 0 60 0 M60 0 C120 10 110 70 45 70 M45 70 L40 100 Z',
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1,
				bottom: 1.25,
				left: 1,
				right: 1,
			}
		},
	callout_cloud: {
			path: 'M40 100 L30 75 M30 75 C20 90 -10 70 15 55 M15 55 C0 50 -5 35 10 25 M10 25 C0 0 55 -5 50 5 M50 5 C45 0 80 -5 80 10 M80 10 C95 -5 110 30 90 40 M90 40 C95 35 110 60 80 60 M80 60 C90 90 40 90 50 75 M50 75 L40 100',
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1,
				bottom: 1.25,
				left: 1,
				right: 1,
			}
		},
	star_explosion: {
			path: 'M10, 0 L30, 25 L40, 10 L50, 15 L60, 5 L68, 20 L90, 0 ' +
				'L85, 28 L100, 42 L85, 55 L100, 65 L85, 70 L100, 95 ' +
				'L65,75 L55, 95 L50, 80 L15, 100 ' +
				'L23, 77 L5, 75 L15, 62 L0, 60 L12, 45 L0, 40 L12, 28Z',
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 2.18,
				bottom: 1.8,
				left: 2.25,
				right: 2.67,
			}
		},
	star_8: {
			path: 'M14.65, 14.65 L35.35, 14.65 L50, 0 L64.65, 14.65 L85.35, 14.65 ' +
				'L85.35, 35.35 L100, 50 L85.35, 64.65 L 85.35, 85.35 ' +
				'L64.65, 85.35 L50, 100 L35.35, 85.35 L14.65, 85.35' +
				'L14.65, 64.65 L0, 50 L14.65, 35.35Z',
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1.71,
				bottom: 1.71,
				left: 1.71,
				right: 1.71,
			}
		},
	banner: {
			path: 'M5, 18 Q7.5 10 10, 15 L10, 90 C10, 100 0, 100 0, 90 L0, 15 Q0, 10 10, 10 ' +
				'L95, 10 Q100, 10 100, 5 C97.5, 0 95, 0 90, 5 C91.7, 8 93.4, 8 95, 5 ' +
				'M100, 5 L100, 85 Q100, 90 95, 90 ' +
				'L10, 90 ' +
				'M0, 15 C3.3, 20 6.6, 20 10, 15',
				attributes: {
					'fill': 'white',
					'stroke': 'black',
					'stroke-width': '2',
					'vector-effect': 'non-scaling-stroke'
				},
				viewBox: '0 0 100 100',
				tanA: {
					top: 1.05,
					bottom: 1.05,
					left: 1,
					right: 1,
				}
		},
	banner_flag: {
			path: 'M0, 20 C34, -40 66, 60 100, 20 L100, 80 C66, 140 34, 40 0, 80Z',
			attributes: {
				'fill': 'white',
				'stroke': 'black',
				'stroke-width': '2',
				'vector-effect': 'non-scaling-stroke'
			},
			viewBox: '0 0 100 100',
			tanA: {
				top: 1.05,
				bottom: 1.05,
				left: 1,
				right: 1,
			}
		}
};
