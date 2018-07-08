// глобальная область видимости
// здесь создаем экземпляры класса и запускаем их

var delay = 1000;
// var i = 0;
// var node_order = [];

var graph = new Graph(delay, "svg", "svg_name");
var tree = new BinaryTree(800, 150);
var numbers = new Numbers(15, "numbers_container", "numbers_path");
var portals = new Portals("portal_close");
var tree_builder = new TreeBuilder(tree, graph);

var start_button = $("#start_button");
var stop_button = $("#stop_button");

start_button.click(function () {
   numbers.reset()
   graph.clearAll();
   tree.clear();

   numbers.generate();
   numbers.render();
   $(this).attr("disabled", true);
   stop_button.attr("disabled", false);
});

stop_button.click(function () {
   location.reload();
   $(this).attr("disabled", true);
   start_button.attr("disabled", false);
})

// Функция графической сортировки дерева
function startSort() {
   var sorted = tree.sort();
   numbers.setSortNumbers(sorted.filter(function (elem) {
         return elem.value;
      }).map(function (elem) {
         return elem.value.value;
      })
   )

   var i = 0;

   var interval = setInterval(function () {
      var key = Object.keys(sorted[i])[0];

      if (!sorted[i].value) {
         graph.drawPath(sorted[i][key], "mediumorchid", key);
      } else {
         graph.fillNode(sorted[i][key]);
      }

      if (++i != sorted.length) return;

      clearInterval(interval);
      
      // Задержка добавлена для предотвращения наложения анимации заливки узла и перемещения его к порталу
      setTimeout(function () {
         graph.moveToPortal(true);
      }, delay);

   }, delay);
}