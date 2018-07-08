/***** Numbers *****
 * Функция-конструктор объекта с числами
 * Вызывается за программу один раз
 * Создает и содержит в себе массив чисел для сортировки,
 * а также методы управления DOM для анимации кружков с числами
 * Принимает:
 * - число генерируемых узлов
 * - идентификатор DOM - элемента, в который будет помещены числа
 * - идентификатор DOM - элемента - пути, по которому движутся числа. Этот элемент нужен для создания изчезновения чисел за границей портала
 */

function Numbers(count, container_id, path_container_id) {
   count = count || 10;

   var container = $("#" + container_id);
   var path = $("#" + path_container_id);

   var numbers = [];
   var container_to_copy = undefined;

   function getRandomNum(min, max) {
      return Math.floor(min + Math.random() * (max + 1 - min));
   }

   // Анимированно копирует массив с числами вверх и помещения его в область исходных данных
   function copyUp(copy_to) {
      $("#" + copy_to).append(
         container
         .clone()
         .attr("id", "numbers_clone")
         .css("opacity", 0)
      )

      var dy = $(".number").last().offset().top - $(".number").eq(0).offset().top;

      $("#numbers_clone")
         .css({
            "position": "relative",
            "opacity": 1,
            "top": dy + "px"
         })
         .animate({
            top: "0px"
         }, delay)
   }

   this.array = function () {
      return numbers;
   }

   this.generate = function () {
      for (var i = 0; i < count; i++) {
         numbers.push(getRandomNum(1, 99));
      }
   }

   // Создает анимированное появление чисел
   // Создание интервала нужно для отго, чтобы облако появление появлялось визуально раньше,
   // чем число, а само число появлялось внутри облака (с задержкой)
   this.render = function () {
      var i = 0;
      if (!numbers.length) return;

      var interval = setInterval(function () {
         $("<div/>")
            .addClass("number_before")
            .text(numbers[i])
            .append(
               $("<div/>").addClass("number_appear")
            ).appendTo(container)
            .delay(100)
            .queue(function () {
               $(this).toggleClass("number number_before")
               if ($(this).index() + 1 == numbers.length) $(document).trigger("numbers_rendered");
            })

         if (++i == numbers.length) clearInterval(interval);
      }, 50);
   }

   // сбрасывает объект для возможности повторной анимации
   this.reset = function () {
      numbers = [];
      container.empty().css("left", "");
      if (container_to_copy) $("#" + container_to_copy).empty();
   }

   // Timeout - для задержки срабатывания.
   // Здесь сохраняются аргументы функции и применяются к ней для отложенного запуска
   this.copyUp = function (copy_to, delay) {
      container_to_copy = copy_to;
      setTimeout(function () {
         copyUp.call(null, copy_to)
      }, delay)
   }

   // Присваивает сортированный результат текущим числам
   this.setSortNumbers = function (arr) {
      container.children().each(function (i) {
         $(this).text(arr[i]);
      });
   }

   // Перемещает контейнер с числами для создания анимаци движения - к порталу или от него
   this.move = function (direction, delay, duration) {
      var control_point = path.offset().left + path.outerWidth();
      var elem = $(".number").last();

      var dx = (direction == "right") ? "+=" + parseInt(control_point - container.offset().left) : "0px";

      var entered = false;

      container
         .delay(delay)
         .animate({
            left: dx
         }, {
            duration: duration,
            easing: "linear",
            progress: function () {
               var right_edge = elem.offset().left + elem.outerWidth();
               if (entered || right_edge < control_point || direction != "right") return;
               $(document).trigger("numbers_collide");
               entered = true;
            }
         })
   }
}

// Функция-констуктор объекта для управления порталами и их синхронности
// Реагирует на события открытия/закрытия порталов и также может управлять или непосредственно
function Portals(portal_class) {
   var htmlPortal = $("." + portal_class).eq(0);

   var self = this;

   $(document).on("close_portals", function (e, trigger_restrict) {
      self.close(trigger_restrict);
   });

   $(document).on("open_portals", function (e, sorted) {
      self.open(0, sorted);
   });

   self.open = function (delay, sorted) {
      htmlPortal.dequeue();

      htmlPortal
         .delay(delay)
         .queue(function () {
            $(this).addClass("portal_open");
            graph.openPortal(true);
            $(document).trigger("portals_opened", sorted);
         })
   }

   self.close = function (trigger_restrict) {
      htmlPortal.removeClass("portal_open");
      graph.openPortal(false);

      if (!trigger_restrict) {
         $(document).trigger("portals_closed");
         return;
      }

      start_button.attr("disabled", false);
   }
}

// Функция конструктор объекта для построения дерева
// Обращается к экземпляру класса BinaryTree, чтобы добавлять элементы и получать порядок обхода,
// а затем данный порядок применять к отрисовке дерева
function TreeBuilder(tree, graph) {

   // вызывает метод рисования текущего узла в порядке обхода
   function drawNodeOrderFunc() {
      var i = 0;

      return function () {
         graph.moveNode(node_order[i++]);
         if (i == node_order.length) i = 0;
      }
   }

   var drawNodeOrder = drawNodeOrderFunc();

   var i = 0;

   var numbers = [];
   var node_order = [];

   // помещает массив с числами для сортировки в локальную область видимости
   this.setNumbers = function (arr) {
      numbers = arr;
   }

   // строит порядок обхода дерева
   // при достижении конца массива с числами - вызывает функцию сортировки
   // а также сопоставляет графический узел и узел дерева
   // вызывает функцию для обхода массива порядка построения
   this.buildOrder = function () {
      if (i == numbers.length) {
         $(document).trigger("start_sort");
         i = 0;
         return;
      }

      node_order = tree.add(numbers[i++]);
      graph.nodeAssign(node_order[node_order.length - 1]);

      this.buildBranch();
   }

   this.buildBranch = function () {
      drawNodeOrder();
   }
}