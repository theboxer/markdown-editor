define('ace/layer/gutter_toolbar', ['require', 'exports', 'ace/lib/dom'], function(require, exports, module) {
    var dom = require("ace/lib/dom");
    require("ace/layer/gutter").Gutter.prototype.update = update =
        function(config) {
            var session = this.session;
            var firstRow = config.firstRow;
            var lastRow = Math.min(config.lastRow + config.gutterOffset,  // needed to compensate for hor scollbar
                session.getLength() - 1);
            var fold = session.getNextFoldLine(firstRow);
            var foldStart = fold ? fold.start.row : Infinity;
            var foldWidgets = this.$showFoldWidgets && session.foldWidgets;
            var breakpoints = session.$breakpoints;
            var decorations = session.$decorations;
            var firstLineNumber = session.$firstLineNumber;
            var lastLineNumber = 0;

            var gutterRenderer = session.gutterRenderer || this.$renderer;

            var cell = null;
            var index = -1;
            var row = firstRow;
            while (true) {
                if (row > foldStart) {
                    row = fold.end.row + 1;
                    fold = session.getNextFoldLine(row, fold);
                    foldStart = fold ? fold.start.row : Infinity;
                }
                if (row > lastRow) {
                    while (this.$cells.length > index + 1) {
                        cell = this.$cells.pop();
                        this.element.removeChild(cell.element);
                    }
                    break;
                }

                cell = this.$cells[++index];
                if (!cell) {
                    cell = {element: null, textNode: null, foldWidget: null};
                    cell.element = dom.createElement("div");
                    cell.textNode = document.createTextNode('');
                    cell.element.appendChild(cell.textNode);
                    this.element.appendChild(cell.element);
                    this.$cells[index] = cell;
                }

                var className = "ace_gutter-cell ";
                if (breakpoints[row])
                    className += breakpoints[row];
                if (decorations[row])
                    className += decorations[row];
                if (this.$annotations[row])
                    className += this.$annotations[row].className;
                if (cell.element.className != className)
                    cell.element.className = className;

                var height = session.getRowLength(row) * config.lineHeight + "px";
                if (height != cell.element.style.height)
                    cell.element.style.height = height;

                if (foldWidgets) {
                    var c = foldWidgets[row];
                    // check if cached value is invalidated and we need to recompute
                    if (c == null)
                        c = foldWidgets[row] = session.getFoldWidget(row);
                }

                if (c) {
                    if (!cell.foldWidget) {
                        cell.foldWidget = dom.createElement("span");
                        cell.element.appendChild(cell.foldWidget);
                    }
                    var className = "ace_fold-widget ace_" + c;
                    if (c == "start" && row == foldStart && row < fold.end.row)
                        className += " ace_closed";
                    else
                        className += " ace_open";
                    if (cell.foldWidget.className != className)
                        cell.foldWidget.className = className;

                    var height = config.lineHeight + "px";
                    if (cell.foldWidget.style.height != height)
                        cell.foldWidget.style.height = height;
                } else {
                    if (cell.foldWidget) {
                        cell.element.removeChild(cell.foldWidget);
                        cell.foldWidget = null;
                    }
                }

                var text = lastLineNumber = gutterRenderer
                    ? gutterRenderer.getText(session, row, cell)
                    : row + firstLineNumber;
                if (text != cell.textNode.data)
                    cell.textNode.data = text;

                row++;
            }

            this.element.style.height = config.minHeight + "px";

            if (this.$fixedWidth || session.$useWrapMode)
                lastLineNumber = session.getLength() + firstLineNumber;

            var gutterWidth = gutterRenderer
                ? gutterRenderer.getWidth(session, lastLineNumber, config)
                : lastLineNumber.toString().length * config.characterWidth;

            var padding = this.$padding || this.$computePadding();
            gutterWidth += padding.left + padding.right;
            if (gutterWidth !== this.gutterWidth && !isNaN(gutterWidth)) {
                this.gutterWidth = gutterWidth;
                this.element.style.width = Math.ceil(this.gutterWidth) + "px";
                this._emit("changeGutterWidth", gutterWidth);
            }
        };
});