(function () {
    "use strict";

    function useState(init) {
        return [];
    }

    function Counter(props) {
        console.log("Counter", dom);
        // const [count, setCount] = useState(props.count)
        let count = props.count;
        function inc() {
            count += 1;
        }
        function dec() {
            count -= 1;
        }
        return function patch(dom) {
            console.log("render", props);
            const div = document.createElement("div");
            const incButton = document.createElement("button");
            div.appendChild(incButton);

            dom.innerHTML = "Count: " + count;
        };
    }

    const Vanilla = {
        define: function define(id, settings) {
        },
        use: function use(adapter) {
        },
        adapter: {
            querySelectorAll: function () {
            }
        },
    };

    Vanilla.define("Vanilla.Router", {
        requires: ["Vanilla.Object"],
        extends: [],
        init: function Router() {
        },
    });

    // Functional first
    // Testable
    // Theme?
    // SSR
    // IE11 safe
    // No VDOM
    // No Framework
    // No dependencies

    function App() {
        const who = "World";
        return function render() {
            return ["div", "Hello, ", who, "!"];
        };
    }

    const Hello = ["Html/text", "Hello, World!"];
    const DeclCounter = ["fn", [],
        ["let",
            "count", 0,
            "dec", ["fn", ["event"], ["update", "count", ["-", "count", 1]]]
        ],
        ["Html/div",
            ["Html/button", { "onClick": ["lookup", "dec"] }, "-"],
            ["lookup", "count"],
            ["Html/button", {
                "onClick": ["fn", ["event"], ["update", "count", ["+", "count", 1]]]
            }, "+"],
        ],
    ];

    function Fn(env) {
        return function mount(what, where) { };
    }
    const mount = Fn({
        "+": "",
        "-": "",
        let: "",
        fn: "",
        update: "",
        lookup: "",
        Html: {
            button: function button() { },
            div: function div() { },
            text: function text() { },
        },
    });
    mount([Counter], document.querySelector("#root"));

    const articles = function (params, ctx) {
    };
    articles["/2020-02-01-hello-world"] = function () {
    };

    const routes = {
        "/": function () {
        },
        "/slug/:id": function (next, { id }) {
            next([Slug, id]);
        },
        "/articles": articles,
        "/about": function () {
        },
    };

    function home() { }

    const declRoutes = {
        "/": [home],
        "/articles": {
            entry: articles,
            routes: {
                "/2020-02-01-hello-world": Hello,
            },
        },
    };

    function trampoline(fn) {
        return function (/* args */) {
            let result = fn.apply(null, arguments);

            while (typeof result === "function") {
                result = result();
            }

            return result;
        };
    }

    function Observable() {
    }
    Observable.range = function range(begin, end, scheduler) {
        const observable = new Observable();
        let i = begin;
        observable.next = function (push) {
            const value = i;
            if (value > end) {
                push({ value: value, done: true });
                return;
            }
            i += 1;
            push({ value: value, done: i > end });
        };
        if (scheduler) {
            observable.scheduler = scheduler;
        }
        return observable;
    };
    Observable.fromEvent = function fromEvent(node, eventName, scheduler) {
        const observable = new Observable();
        observable.next = function next(push) {
            observable.next = function noop() { };

            node.addEventListener(eventName, function (evt) {
                push({ value: evt });
            }, { passive: true });
        };
        if (scheduler) {
            observable.scheduler = scheduler;
        }
        return observable;
    };
    Observable.of = function of(ls, scheduler) {
        const observable = new Observable();
        const len = ls.length;
        let i = 0;
        observable.next = function next(push) {
            if (i >= len) {
                push({ value: ls[len - 1], done: true });
                return;
            }
            const value = ls[i];
            i += 1;
            push({ value: value, done: i >= len });
        };
        if (scheduler) {
            observable.scheduler = scheduler;
        }
        return observable;
    };
    Observable.timer = function timer(initialDelayMs, periodMs, scheduler) {
        const observable = new Observable();
        scheduler = scheduler || observable.scheduler;
        let i = 0;
        observable.next = function next(push) {
            observable.next = function noop() { };
            function ping() {
                const current = { value: i };
                i += 1;
                push(current);

                if (periodMs > 0) {
                    scheduler(ping, periodMs);
                }
            }
            scheduler(ping, initialDelayMs)
        };
        if (scheduler) {
            observable.scheduler = scheduler;
        }
        return observable;
    };
    Observable.defaultScheduler = function defaultScheduler(next, ms) {
        if (!ms) {
            next();
            return;
        }
        setTimeout(next, ms)
    };
    Observable.prototype.scheduler = Observable.defaultScheduler;
    Observable.prototype.pipe = function pipe(operator, scheduler) {
        const that = this;
        scheduler = scheduler || that.scheduler;
        const descriptor = {
            next: {
                value: function (upstream) {

                    function step(pushed) {
                        if (step.done) {
                            return;
                        }
                        if (pushed.done) {
                            // Schedule the last one
                            step.done = true;
                        }
                        operator(pushed, push, scheduler);
                    }

                    function push(current) {
                        if (current.skip) {
                            that.next(step);
                            return;
                        }
                        if (current.done) {
                            // Schedule the last one
                            step.done = true;
                        }
                        upstream(current);
                    }
                    that.next(step);
                },
            },
        };
        if (scheduler !== that.scheduler) {
            descriptor.scheduler = {
                value: scheduler,
            };
        }
        return Object.create(that, descriptor);
    };
    Observable.prototype.subscribe = function subscribe(next) {
        const that = this;

        function push(current) {
            next(current.value);
            if (current.done) {
                return;
            }
            that.next(push);
        }

        that.next(push);

        return that;
    };

    function delay(ms) {
        return function (current, push, scheduler) {
            scheduler(function () {
                push(current)
            }, ms);
        };
    }

    function map(fn) {
        return function (current, push) {
            push({
                value: fn(current.value),
                done: current.done
            });
        };
    }

    function filter(predicate) {
        return function (current, push) {
            // console.log('filter', current);
            if (predicate(current.value)) {
                push(current);
            } else {
                push({ skip: true });
            }
        };
    }

    function skip(n) {
        let i = 1;
        return function (current, push) {
            if (i <= n) {
                i += 1;
                push({ skip: true });
                return;
            }
            push(current);
        };
    }

    function take(n) {
        let i = 1;
        return function (current, push) {
            if (i < n) {
                i += 1;
                push(current);
                return;
            }
            push({ value: current.value, done: true });
        };
    }

    function toArray() {
        const buffer = [];
        return function (current, push) {
            // console.log("toArray.step", current);
            buffer.push(current.value);
            if (current.done) {
                push({ value: buffer, done: current.done });
            } else {
                push({ skip: true });
            }
        };
    }

    // function flatMap(fn) {
    //     let done = false;
    //     return function (current, push) {
    //         console.log("flatMap", current);
    //         if (done) {
    //             push({ skip: true });
    //             return;
    //         }

    //         if (current.done) {
    //             done = true;
    //         }

    //         const values = fn(current.value);
    //         const len = values.length - 1;
    //         values.forEach(function (it, i) {
    //             push({ value: it, done: current.done && i === len });
    //         });
    //     };
    // }

    function scan(reduce, acc) {
        return function (current, push) {
            acc = reduce(acc, current.value)
            push({ value: acc, done: current.done });
        };
    }

    function syncScheduler(next) {
        next();
    }

    Observable.fromEvent(document, "click")
        .pipe(map(function (evt) { return { left: evt.x, top: evt.y }; }))
        .subscribe(function (loc) {
            console.log("click->(", loc.left, ",", loc.top, ")");
        });

    Observable.timer(1000, 250)
        .pipe(filter(function (x) { return x % 2 === 0; }))
        .pipe(map(function (x) { return x / 2 + 1; }))
        .pipe(take(10))
        .pipe(skip(2))
        .subscribe(function (x) {
            console.log("heartbeat->", x);
        });

    Observable.range(1, 10)
        .pipe(scan(function (acc, curr) { return acc + curr; }, 0))
        .subscribe(function (x) {
            console.log("sum(1..10).signal->", x);
        });

    // Observable.range(1, 3)
    //     .pipe(map(function (x) { return x * 10; }))
    //     .pipe(flatMap(function (x) { return [x + 1, x + 2]; }))
    //     // .pipe(toArray())
    //     .subscribe(function (x) {
    //         console.log("flatMap.signal->x", x);
    //     });

    Observable.range(1, 1024)
        .pipe(map(function (x) { return x * 7; }))
        .pipe(toArray())
        .subscribe(function (x) {
            console.log("sync.signal->", x);
        });

    Observable.of([1, 2, 3]/*, syncScheduler*/)
        .pipe(filter(function (x) { return x % 2 === 1; }))
        .pipe(map(function (x) { return x * 2; }))
        .pipe(map(function (x) { return x * 3; }))
        .pipe(delay(1000))
        .subscribe(function (x) {
            console.log("delayed.signal->", x);
        });
})();
