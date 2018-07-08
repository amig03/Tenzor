"use strict";

/***** Graph *****
 * Функция-конструктор объекта SVG полотна для рисования
 * Вызывается за программу один раз
 * Содержит методы для рисования
 * Принимает:
 * - время анимации в мс
 * - идентификатор DOM - элемента, в который будет помещено полотно
 * - идентификатор DOM - элемента, в котором будет написан текст SORTING ZONE. Нужен для установки ширины этого элемента, равной ширине полотна
 */

function Graph(animation_time, svg_id, svg_name_id) {
   var size = 1600;
   var graph = SVG(svg_id).size(size, size);

   $("#" + svg_id).width(size);
   $("#" + svg_name_id).width(size);

   var start_x = 150;      // Координаты X и Y - начала цепочки узлов, находящихся не в дереве
   var start_y = 60;
   var step = 50;          // Шаг по оси X для определения координаты в цепочке узлов

   // Объявляем переменные в локальной области видимости класса. Описание ниже
   var links_group, links_path, nodes, nodes_chain, cur_node, links_check, labels, sorted_nodes, portal, portal_group, sorted_index;
   
   // Функция инициализации дерева. Присваивает необходимые переменные для работы при новой сортировке
   function initializeGraph() {
      links_group = graph.group();                       // группировка SVG элементов. Аналог слоев. Это - слой для постоянных связей дерева
      links_path = graph.group();                        // слой для временных связей дерева - анимированного отображения обхода
      portal_group = graph.group();                      // слой для портала
      nodes_chain = graph.group();                       // слой для цепочки узлов
      labels = graph.group();                            // слой для текстовых меток, отображающий сравнение узлов в течение прохода
      nodes = [];                                        // массив с отрисованными узлами в дереве
      sorted_nodes = [];                                 // массив с отсортированными узлами
      sorted_index = 0;                                  // текущий индекс в массиве отсортированных узлов
      cur_node = undefined;                              // текущий узел - узел, которым мы обходим дерево
      links_check = {};                                  // массив для проверки, нарисована ли связь между узлами, которую мы хотим нарисовать
      graph.rect(50, 100).fill("white").move(0, 20);     // рисуем прямоугольник, чтобы создавалось ощущение, что узлы выходят из портала
      portal = portal_group                              // рисуем портал
         .ellipse(50, 100)
         .fill("black")
         .move(50, 10)
         .opacity(0)
         .scale(0.1)
   }

   initializeGraph();

   /*** Приватный метод - функция-конструктор графического узла ***
    * Принимает числовое значение узла и его координаты
    * Рисует два круга - один белый, для основного вида, и другой - фиолетовыйдля обозначения отсортированного узла
    * Пишет текст со значением узла
    * Все три элемента помещаются в группу, которая затем перемещается к месторасположению узла
    * 
    * Итоговый экземпляр содержит в себе два свойства - graph и tree_node.
    * В graph помщается графическое представление узла, а в tree_node - ссылка на узел дерева (экземпляр Node, использующийся в BinaryTree)
    */

   function GraphNode(value, x, y) {
      var node_group = nodes_chain.group();
      var color_circle = nodes_chain.circle().radius(20).stroke({color: "black", width: 2}).fill("mediumorchid");
      var circle = nodes_chain.circle().radius(19).fill("white");
      var text = nodes_chain.plain(String(value)).font({anchor: "middle", size: 20}).attr({"alignment-baseline": "central"});
      
      this.graph = node_group.add(color_circle).add(circle).add(text).move(x, y);
      this.tree_node = undefined;
   }

   // метод возвращает коэффициент размера в зависимости от уровня узла, так как чем глубже узлы, тем плотнее они находятся друг к другу
   function getLevelScale(level) {
      var scales = [1, 1, 1, 1, 0.9, 0.7, 0.5, 0.3];
      return (scales[level] ? scales[level] : 0.3);
   }

   // Запрещает рисовать линии с одинаковыми координатами начала и конца
   // Рисуемая линия добавляется в объект.
   // Свойства объекта это строка вида x1y1x2y2
   function checkSameLines(obj, coords) {
      var property = coords[0].join("") + coords[1].join("");
      if (obj[property]) return true;
      obj[property] = true;
      return false;
   }

   // Рисует постоянную связь между узлами
   function drawLink(node) {
      if (!node.parent) return;
      var coords = [[node.x, node.y], [node.parent.x, node.parent.y]];
      if (checkSameLines(links_check, coords)) return;

      links_group
         .line().plot([coords[1], coords[0]])
         .stroke({width: 2})
   }

   // Очищает SVG полотно и запускает функцию инициализации
   this.clearAll = function () {
      graph.clear();
      initializeGraph();
   }

   // Метод перемещает цепочку узлов к порталу или от него
   // от портала - при начале сортировки
   // к порталу - при окончании сортировки
   // при окончании сортировки создает событие sort_numbers_enter
   // по завершении анимации входа/выхода из портала вызывает событие close_portals
   // P.S. изменение времени анимации сделано для предотвращения наложения различных событий,
   // например, закрашивания отсортированного узла и начала движения его к порталу
   this.moveToPortal = function (sorted_arr, direction) {
      var arr = (sorted_arr) ? sorted_nodes : nodes;

      // флаг, обозначающий, вошел ли первый элемент сортированных узлов в портал
      // при этом создается событие sort_numbers_enter
      // нужен для синхронности со вторым порталом
      var entered = false;

      // обход целевого массива
      arr.forEach(function (item, i) {
         var dx = start_x + step * i;
         var _animation_time = 1400;
         var delay = 0;

         // если направление движения - к порталу - вызывается событие open_portals
         // здесь изменение времени анимации сделано для синхронности выхода элементов из второго портала
         if (direction != "out") {
            dx = start_x + step * i - size;
            _animation_time = 4000;
            delay = animation_time * 1.3;
            if (i == 0) $(document).trigger("open_portals", sorted_arr);
         }

         // перемещение узла цепочки
         item.graph
            .delay(delay)
            .animate(_animation_time)
            .move(dx, start_y)
            .during(function () {
               if (entered) return;
               if (sorted_arr && sorted_nodes[0].graph.x() < 150) {
                  $(document).trigger("sort_numbers_enter");
                  entered = true;
               }
            })
            .after(function () {
               if (i != arr.length - 1) return;
               $(document).trigger("close_portals", sorted_arr);
            })
      })
   }

   // метод, помечающий узел как отсортированный
   // Здесь используются те несколько окружностей, заложенных в экземпляре графического узла
   // Фиолетовая - для анимации закрашивания
   // Белая - становится расходящейся волной от центра
   this.fillNode = function (node) {
      this.nodeAssign(node);

      // создание и анимация закрашивания узла, а сразу после нее - следующие анимации и действия
      cur_node.graph.get(1).animate(animation_time * 0.2).scale(0.1).after(function () {
         // создание и анимация расходящейся волны
         this
            .fill("transparent")
            .stroke({width: 3, color: "darkorchid"})
            .animate(animation_time * 0.5)
            .opacity(0)
            .scale(3);

         // Определение координаты будущего отсортированного узла
         var x = start_x + step * sorted_index++;

         // Создание отсортированного узла и помещение его в массив с отсортированными узлами
         var sorted_node = new GraphNode(node.value, x, start_y);
         sorted_nodes.push(sorted_node);

         // Плавное появление отсортированного узла в цепочке узлов
         sorted_node.graph
            .opacity(0)
            .animate(animation_time * 0.7)
            .opacity(1);

         // Отрисовка у белой окружности границ (сначала их нет для более приятной картинки) и выставление нормального радиуса вместо 19
         // (это было сделано, чтобы белая окружность не заходила на итоговые границы)
         sorted_node.graph.get(1)
            .radius(20)
            .stroke({width: 2, color: "black"});

         // создание и анимация расходящейся волны от узла в цепочке
         sorted_node.graph.get(0)
            .fill("transparent")
            .stroke({width: 3, color: "darkorchid"})
            .animate(animation_time * 0.7)
            .opacity(0)
            .scale(3);

         // Создание и анимация "лазерного луча", соединяющего текущий узел и узел в цепочке отсортированных узлов
         graph
            .line().plot(cur_node.tree_node.x, cur_node.tree_node.y, x, start_y)
            .stroke({width: 5, color: "mediumorchid", linecap: "round"})
            .opacity(0.7)
            .animate(50)
            .stroke({width: 12})
            .loop(parseInt(animation_time * 0.7 / 50))
            .after(function () {
               this.opacity(0);
            })
      });
   }

   // анимированная отрисовка пути обхода дерева
   // зависит от направления:
   // при проходе вглубь отрисовка - от родителю к узлу. цвет пути - красный
   // при направлению к корн - обратная отрисовка и цвет пути - фиолетовый
   this.drawPath = function(node, color, direction) {

      if (!node.parent) return;

      var coords = [[node.x, node.y], [node.parent.x, node.parent.y]];
      if (direction == "backward") coords.reverse();

      color = color || "red";

      links_path
         .line().plot([coords[1], coords[1]])
         .stroke({width: 3, color: color})
         .animate(animation_time)
         .plot([coords[1], coords[0]]);
      
      // маленькая окружность, показывающая направление движения
      // размыта фильтром гаусса
      var circle = links_path
         .circle()
         .radius(5)
         .fill(color)
         .move(coords[1][0] - 5, coords[1][1] - 5)
         .attr({width: 30, height: 30})

      circle.filter(function (add) {
            add.gaussianBlur(3);
         }).attr({width: "50px", height: "50px", x: "-50%", y: "-50%"})

      circle
         .animate(animation_time)
         .move(coords[0][0] - 5, coords[0][1] - 5)
   }

   // метод открытия портала на SVG полотне
   this.openPortal = function (open) {
      if (open) {
         portal
            .opacity(1)
            .animate(animation_time, ">")
            .scale(1);
         return;
      }

      portal
         .animate(animation_time, ">")
         .scale(0.1)
         .after(function () {
            this.opacity(0);
         })
   }

   // Отрисовка цепочки узлов по массиву узлов. Затем - выход из портала
   this.drawArray = function (arr) {
      arr.forEach(function (item, i) {
         nodes.push(new GraphNode(
            item,
            start_x - step * (arr.length - 1 - i) - 180,
            start_y
         ));
      });

      this.moveToPortal(false, "out");
   }

   // Задает соответствие графического узла и узла экземпляра класса BinaryTree
   this.nodeAssign = function (node) {
      nodes[node.index].tree_node = node;
      cur_node = nodes[node.index];
   }

   // перемещает узел к следующему узлу на его пути к месту
   this.moveNode = function (node_to) {
      var same_nodes = node_to == cur_node.tree_node;
      
      this.drawPath(node_to);
      
      // Рисуем временный узел, расположенный чуть выше и правее обычных узлов
      // Перемещаем его к следующему узлу и вызываем событие next_node_in_order, означающее, что требуеися следующий узел в очереди обхода
      cur_node.graph
         .delay((cur_node.tree_node == nodes[0].tree_node) * animation_time)
         .animate(animation_time)
         .move(node_to.x - 30, node_to.y - 10)
         .after(function () {
            drawLink(node_to);
            if (!same_nodes) $(document).trigger("next_node_in_order");
         })

      // Если узлы разные - размещает текстовую метку, показывающую, куда далее должен двигаться узел - влево или вправо
      if (!same_nodes) {
         labels
            .plain(cur_node.tree_node.value + (cur_node.tree_node.value < node_to.value ? " < " : " >= ") + node_to.value)
            .font({anchor: "middle", size: 15})
            .attr({"alignment-baseline": "central"})
            .move(node_to.x, node_to.y - 40)
         return;
      }

      // Если перемещаемый узел совпадает с узлом из очереди перемещения - то значит это его место. Размещаем его.
      cur_node.graph
         .animate(animation_time * 0.5)
         .move(node_to.x, node_to.y)
         .scale(getLevelScale(cur_node.tree_node.level))
         .after(function () {
            cur_node = undefined;
            links_path
               .animate(animation_time)
               .opacity(0)
               .after(function () {
                     this.clear();
                     this.opacity(1);
                     labels.clear();
                     $(document).trigger("node_order_end");
                  });
            })
   }
}