var remote = remoteObject.remote("ws://localhost:8080");
// hold references to cleanup functions to react elements, look in objectManipulator.js to see that component&objectManipulator return functions which are used to clean themselves up.
var cleanups = {};

remote.listenForCreation(function (object, namespace, id) {
    if (namespace === "component") {
        window.setTimeout(function () {
            // append a span to the output area, so react can render a card inside it
            var out = document.createElement("span");
            document.querySelector("#output").appendChild(out);
            cleanups[id] = componentManipulator(object, out, object.name);

            object.onDelete(function () {
                // remove the card whenever an object gets deleted
                cleanups[id]();
            });
        }, 15);
    } else {
        window.setTimeout(function () {
            // append a span to the output area, so react can render a card inside it
            var out = document.createElement("span");
            document.querySelector("#output").appendChild(out);
            cleanups[id] = objectManipulator(object, out, namespace);

            object.onDelete(function () {
                // remove the card whenever an object gets deleted
                cleanups[id]();
            });
        }, 15);
    }
});

var draw = canvasWithSize(500, 500);
var ctx = draw.ctx;
var canvas = draw.canvas;

function deepMinMax(lists) {
    var max = -10000000000;
    var min = 10000000000;

    lists.forEach(function (lst) {
        var mn = Math.min.apply(null, lst);
        var mx = Math.max.apply(null, lst);

        if (mn < min) {
            min = mn;
        }

        if (mx > max) {
            max = mx;
        }
    });

    return {
        min: min,
        max: max
    };
}

function randomColor () {
    var r = Math.floor(Math.random() * 180);
    var g = Math.floor(Math.random() * 180);
    var b = Math.floor(Math.random() * 180);

    return "#" + r.toString(16) + g.toString(16) + b.toString(16);
}

var Graph = component({
  name: "Graph",
  getInitialState: function () {
    return {sources: []};
  },
  addPoint: function (id, point) {
    var sources = this.state.sources.slice();
    sources[id].push(point);
    this.render();
  },
  addSource: function (source) {
    var sources = this.state.sources.slice();
    sources.push([]);
    this.state.alter("sources", sources);

    sources[this.state.sources.length - 1].color = randomColor();

    return this.state.sources.length - 1;
  },
  render: function () {
    var that = this;
    var ctx = this.props.ctx;
    var canvas = ctx.canvas;
    var minmax = deepMinMax(this.state.sources);
    var max = minmax.max;
    var min = minmax.min;
    var size = max - min;
    var stepY = size / canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;

    this.state.sources.forEach(function (values) {
        ctx.strokeStyle = values.color;
        values = values.slice(-canvas.width);
        values.forEach(function (value, i) {
            var v1 = values[i - 1];
            var v2 = value;
            if (v1 && v2) {
                ctx.beginPath();
                ctx.moveTo(i - 1, canvas.height - translate(v1, min, max, 0, canvas.height));
                ctx.lineTo(i,     canvas.height - translate(v2, min, max, 0, canvas.height));
                ctx.stroke();
                ctx.closePath();
            }
        });
    });
  }
});

graph = Graph({
    ctx: ctx
});
