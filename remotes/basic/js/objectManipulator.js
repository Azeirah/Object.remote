(function () {
    var ANumber = React.createClass({displayName: 'ANumber',
        getInitialState: function () {
            return {
                value: this.props.value || 0,
                directlyEditing: false,
                mousedown: false
            };
        },
        setValue: function (newValue) {
            this.props.object.update(this.props.name, newValue);
            this.setState({value: newValue});
        },
        doubleClick: function () {
            var that = this;
            if (this.props.writable) {
                // toggle directly editing mode
                this.setState({directlyEditing: !this.state.directlyEditing});
                window.setTimeout(function () {
                    that.refs.input? that.refs.input.getDOMNode().focus() : null;
                }, 5);
            }
        },
        directlyEdit: function (event) {
            var value = window.parseFloat(event.target.value, 10);
            if (!window.isNaN(value)) {
                this.setValue(value);
            }
        },
        keyup: function (event) {
            // enter was pressed or esc was pressed, esc should probably return to the initial value though...
            if (event.which === 13) {
                this.setState({directlyEditing: false});
            }
        },
        blur: function () {
            this.setState({directlyEditing: false});
        },
        componentDidMount: function () {
            var that = this;
            this.props.object.addUpdateListener(function (key, newValue) {
                if (key === that.props.name) {
                    that.setState({value: newValue});
                }
            });

            // bind the object value to this component 60 times per second, it's just polling an object really...
            // super dirty 2-way data binding <3
            window.addEventListener("mousedown", this.mousedown);
            window.addEventListener("mouseup", this.mouseup);
            window.addEventListener("mousemove", this.mousemove);

        },
        componentWillUnmount: function () {
            window.removeEventListener("mousedown", this.mousedown);
            window.removeEventListener("mouseup", this.mouseup);
            window.removeEventListener("mousemove", this.mousemove);
        },
        mousedown: function (event) {
            lastposition = {
                x: event.clientX,
                y: event.clientY,
                target: event.target
            };

            if (event.which === 1 && this.refs.scrubbable && event.target === this.refs.scrubbable.getDOMNode()) {
                this.setState({mousedown: true});
            }
        },
        mouseup: function (event) {
            if (event.which === 1) {
                this.setState({mousedown: false});
            }
        },
        mousemove: function (event) {
            if (this.state.mousedown) {
                var newposition = {
                    x: event.clientX,
                    y: event.clientY,
                    target: event.target
                };
                var dx = newposition.x - lastposition.x;
                var dy = newposition.y - lastposition.y;

                event.ctrlKey?  dx *= 5  : null;
                event.shiftKey? dx *= .2 : null;

                if (this.state.mousedown && !this.state.directlyEditing) {
                    this.setValue(this.state.value + dx);
                }

                lastposition = newposition;
            }
        },
        render: function () {
            var className = "unselectable value scrubbable";
            className += this.state.mousedown? " heldDown" : "";
            var tooltip = "drag or doubleclick";
            if (this.state.directlyEditing) {
                return (
                    React.createElement("div", null,
                        React.createElement("span", {className: "number"}, this.props.name, ": "),
                        React.createElement("input", {ref: "input", onBlur: this.blur, onKeyUp: this.keyup, onChange: this.directlyEdit, onDoubleClick: this.doubleClick, value: this.state.value})
                    )
                );
            }
            return (
                React.createElement("div", null,
                    React.createElement("span", {className: "number"}, this.props.name, ": "),
                    React.createElement("span", {ref: "scrubbable", title: tooltip, onDoubleClick: this.doubleClick, className: className}, parseInt(this.state.value, 10))
                )
            );
        }
    });

    var AString = React.createClass({displayName: 'AString',
        getInitialState: function () {
            return {
                value: this.props.value
            };
        },
        setValue: function (value) {
            this.props.object.update(this.props.name, value);
            this.setState({value: value});
        },
        componentDidMount: function () {
            var that = this;
            this.props.object.addUpdateListener(function (key, newValue) {
                if (key === that.props.name) {
                    that.setState({value: newValue});
                }
            });
        },
        onChange:function (event) {
            this.setValue(event.target.value);
        },
        render: function () {
            return (
                React.createElement("div", null,
                    React.createElement("span", {className: "string"}, this.props.name, ": "),
                    React.createElement("input", {onChange: this.onChange, value: this.state.value})
                )
            );
        }
    });

    var ABoolean = React.createClass({displayName: 'ABoolean',
        getInitialState: function () {
            return {
                value: this.props.value
            };
        },
        setValue: function (value) {
            this.props.object.update(this.props.name, value);
            this.setState({value: value});
        },
        componentDidMount: function () {
            var that = this;
            this.props.object.addUpdateListener(function (key, newValue) {
                if (key === that.props.name) {
                    that.setState({value: newValue});
                }
            });
        },
        click: function () {
            this.setValue(!this.state.value);
        },
        render: function () {
            var className = "togglable";
            className += this.state.value === true ? " toggled" : " not-toggled";
            return (
                React.createElement("div", null,
                    React.createElement("span", {className: "boolean"}, this.props.name, ": "),
                    React.createElement("span", {className: className, onClick: this.click}, this.state.value + "")
                )
            );
        }
    });

    var ManipulatableObject = React.createClass({displayName: 'ManipulatableObject',
        componentWillMount: function () {
            var listeners = [];
            var that = this;

            this.props.object.addUpdateListener = function (listener) {
                listeners.push(listener);
            };

            this.props.object.update = function (path, newValue) {
                that.props.object.set(path, newValue);
            };

            this.props.object.onUpdate(function (obj, path, newValue) {
                listeners.forEach(function (l) {
                    l(path, newValue);
                });
            });
        },
        render: function () {
            var that   = this;
            var types  = this.props.types;
            var object = this.props.object;
            var keys   = Object.keys(object);

            var manipulators = keys.filter(function (key) {
                return types.hasOwnProperty(typeof object[key]);
            }).map(function (key) {
                var value     = object[key];
                var component = types[typeof value];
                var c = component({
                    name: key,
                    key: key,
                    object: that.props.object,
                    value: value,
                    writable: true
                });

                return (
                    c
                );
            });

            return (
                React.createElement("div", {className: "manipulator"},
                    React.createElement("span", {className: "name"}, this.props.name),
                    manipulators
                )
            );
        }
    });

    var ManipulatableComponent = React.createClass({displayName: "ManipulatableComponent",
        componentWillMount: function () {
            var that = this;
            var stateListeners = [];
            var propListeners  = [];

            this.props.component.state.onUpdate = function (listener) {
                stateListeners.push(listener);
            };

            this.props.component.props.onUpdate = function (listener) {
                propListeners.push(listener);
            };

            this.props.component.state.set = function (path, newValue) {
                that.props.component.set("state." + path, newValue);
            };

            this.props.component.props.set = function (path, newValue) {
                that.props.component.set("props." + path, newValue);
            };

            this.props.component.onUpdate(function (obj, path, newValue) {
                if (path.indexOf("state") !== -1) {
                    stateListeners.forEach(function (l) {
                        l(obj, path.replace("state.", ""), newValue);
                    });
                } else if (path.indexOf("props") !== -1) {
                    propListeners.forEach(function (l) {
                        l(obj, path.replace("props.", ""), newValue);
                    });
                }
            });
        },
        render: function () {
            return (
                React.createElement("div", {className: "something"},
                    React.createElement("h6", {className: "componentName"}, this.props.name),
                    React.createElement(ManipulatableObject, {object: this.props.component.state, parent: this.props.component, types: this.props.types, name: "state"}),
                    React.createElement(ManipulatableObject, {object: this.props.component.props, parent: this.props.component, types: this.props.types, name: "props"})
                )
            );
        }
    });

    function componentManipulator(component, container, name) {
        var types = {
            "number": React.createFactory(ANumber),
            "string": React.createFactory(AString),
            "boolean": React.createFactory(ABoolean)
        };
        React.render(React.createElement(ManipulatableComponent, {component: component, types: types, name: name}), container);

        return function removeManipulator() {
            React.unmountComponentAtNode(container);
        };
    }

    function makeManipulator(object, container, name) {
        var types = {
            "number": React.createFactory(ANumber),
            "string": React.createFactory(AString),
            "boolean": React.createFactory(ABoolean)
        };
        React.render(React.createElement(ManipulatableObject, {object: object, types: types, name: name}), container);

        return function removeManipulator() {
            React.unmountComponentAtNode(container);
        };
    }

    makeManipulator.number  = ANumber;
    makeManipulator.string  = AString;
    makeManipulator.boolean = ABoolean;

    window.componentManipulator = componentManipulator;
    window.objectManipulator    = makeManipulator
}());
