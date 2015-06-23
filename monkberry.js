(function (window) {
  function Monkberry() {
    this.pool = new Pool();
    this.templates = {};
    this.filters = {};
    this.wrappers = {};
  }

  Monkberry.prototype.foreach = function (parent, node, children, template, data) {
    var i, j, len, childrenSize = Map.size(children);

    len = childrenSize - data.length;
    for (i in children) if (children.hasOwnProperty(i)) {
      if (len-- > 0) {
        children[i].remove();
      } else {
        break;
      }
    }

    j = 0;
    for (i in children) if (children.hasOwnProperty(i)) {
      children[i].update(data[j++]);
    }

    for (j = childrenSize, len = data.length; j < len; j++) {
      var view = this.render(template, data[j]);
      view.parent = parent;

      view.appendTo(node);
      i = Map.push(children, view);

      var removeNodes = view.remove;
      view.remove = (function (i, view, removeNodes) {
        return function () {
          removeNodes();
          Map.remove(children, i);
        };
      })(i, view, removeNodes);
    }
  };

  Monkberry.prototype.render = function (name, values, no_cache) {
    no_cache = no_cache || false;

    if (this.templates[name]) {
      var view, self = this;

      if (no_cache) {
        view = this.templates[name]();
      } else {
        view = this.pool.pull(name);
        if (!view) {
          view = this.templates[name]();
        }
      }

      view.appendTo = function (node) {
        for (var i of view.nodes) {
          node.appendChild(i);
        }
      };

      view.remove = function () {
        for (var node of view.nodes) {
          node.parentNode.removeChild(node);
        }
        self.pool.push(name, view);
      };

      if (values !== undefined) {
        view.update(values);
      }

      if (this.wrappers[name]) {
        view = this.wrappers[name](view);
      }

      return view;
    } else {
      throw new Error('Template with name "' + name + '" does not found.');
    }
  };

  Monkberry.prototype.prerender = function (name, times) {
    while (times--) {
      this.pool.push(name, this.render(name, undefined, true));
    }
  };

  Monkberry.prototype.mount = function (templates) {
    var _this = this;
    Object.keys(templates).forEach(function (name) {
      _this.templates[name] = templates[name];
    });
  };

  Monkberry.prototype.willWrap = function (name, wrap) {
    this.wrappers[name] = wrap;
  };

  function Pool() {
    this.store = {};
  }

  Pool.prototype.push = function (name, view) {
    if (!this.store[name]) {
      this.store[name] = [];
    }
    this.store[name].push(view);
  };

  Pool.prototype.pull = function (name) {
    if (this.store[name]) {
      return this.store[name].pop();
    } else {
      return void 0;
    }
  };

  function Map() {
  }

  Map.max = function (map) {
    var max = 0;
    for (var i in map) if (map.hasOwnProperty(i)) {
      if (i > max) {
        max = i;
      }
    }
    return parseInt(max);
  };

  Map.push = function (map, element) {
    var max = Map.max(map) + 1;
    map[max] = element;
    return max;
  };

  Map.remove = function (map, i) {
    delete map[i];
  };

  Map.size = function (map) {
    var size = 0;
    for (var i in map) if (map.hasOwnProperty(i)) {
      size++;
    }
    return size;
  };

  window.monkberry = new Monkberry();
})(window);