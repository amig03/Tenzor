"use strict";

/***** Node *****
 * Функция, возвращающая конструктор объектов - узлов дерева.
 * Переменная index вынесена в замыкание для автоматического присвоения идентификатора узла
*/

var Node = (function () {
   var index = 0;

   return function (value, level, parent, x, y) {
      index = (level == 0) ? 0 : index + 1;           // Обнуляем идентификатор узла, если уровень = 0, то есть начата новая сортировка
      
      this.value = value;                             // Числовое значение узла
      this.parent = parent;                           // Родитель узла. Необходим для рисования
      this.left = null;                               // Левый потомок узла
      this.right = null;                              // Правый потомок узла
      this.level = level;                             // Уровень узла. Нужен для расчета расстояний между узлами и для определения размеров графического узла
      this.x = isNaN(x) ? null : x;                   // Координата X узла
      this.y = isNaN(y) ? null : y;                   // Координата Y узла
      this.index = index;                             // Идентификатор узла
   }
})();

/***** Binary Tree *****
 * Функция-конструктор объекта бинарного дерева
 * Вызывается за программу один раз
 * Принимает стартовые координаты корневого узла - для расчета координат последующих узлов
 */

function BinaryTree(start_x, start_y) {
   this.root = null;

   /*** Метод добавления узла ***
    * Добавляет новый узел в бинарное дерево
    * Вызывает рекурсивную функцию subtreeAdd, которая вызывает сама себя до тех пор, пока не найдет узел с пустым потомком
    * и не добавит новый узел:
    * - в качестве левого потомка - если значение добавляемого узла меньше, чем значение текущего узла и у текущего узла отсутствует левый потомок
    * - в качестве правого потомка - если значение добавляемого узла больше или равно, чем значение текущего узла и у текущего узла отсутствует правый потомок
    * Возвращает массив added_nodes - массив узлов дерева, которые обходились в процессе поиска места для нового узла
    */
   
   this.add = function (value) {
      if (value == undefined) return;
      
      var cur_level = 1;
      var added_nodes = [];
      
      if (!this.root) {
         added_nodes.push(this.root = new Node(value, 0, null, start_x, start_y));
         return added_nodes;
      } else {
         added_nodes.push(this.root);
         subtreeAdd(this.root);
      }

      function subtreeAdd(node) {
         var targetProp = (value >= node.value) ? "right" : "left";
         var sign = (value >= node.value) ? 1 : -1;

         var next_x = node.x + sign * start_x / Math.pow(2, cur_level);
         var next_y = node.y + 100;

         if (!node[targetProp]) {
            added_nodes.push(node[targetProp] = new Node(value, cur_level, node, next_x, next_y));
            return added_nodes;
         } else {
            cur_level++;
            added_nodes.push(node[targetProp]);
            return subtreeAdd(node[targetProp]);
         }
      }

      return added_nodes;
   }

   /*** Метод сортировки бинарного дерева ***
    * Сортирует узлы дерева по возрастанию рекурсивным методом обхода In-Order:
    * 1. Вызываем функцию с узлом (для первого запуска выбран корневой узел)
    * 2. Если узла не существует - возвращаем undefined
    * 3. В результирующий массив записываем объект с ключом forward и значением - текущим узлом
    *    Это нужно для рисования, и говорит программе, что нужно отрисовать путь вглубь дерева от родителя текущего узла к текущему узлу
    * 4. Если есть левый потомок, вызываем функцию с левым потомком
    * 5. В результирующий массив записываем объект с ключом value и значением - текущим узлом
    *    Это нужно для рисования, и говорит программе, что отсюда нужно поместить узел в массив отсортированных узлов
    * 6. Если есть правый потомок, вызываем функцию с правым потомком
    * 7. В результирующий массив записываем объект с ключом backward и значением - текущим узлом
    *    Это нужно для рисования, и говорит программе, что нужно отрисовать путь по направлению к корню дерева от текущего узла к родителю текущего узла
    * 
    * Метод возвращает массив с информацией обхода дерева - какие узлы обходились и какие - сортировались
    */

   this.sort = function () {
      function resultObject(property, value) {
         var obj = {};
         obj[property] = value;
         return obj;
      }
      
      function traversalTree(node) {
         if (node == null) return;

         if (node != self.root) result.push(resultObject("forward", node));

         traversalTree(node.left);

         result.push(resultObject("value", node));

         traversalTree(node.right);

         if (node != self.root) result.push(resultObject("backward", node));
      }

      var self = this;
      var result = [];
      traversalTree(self.root);
      return result;
   }

   // Этот метод очищает значение корня дерева для возможности начать сортировку сначала

   this.clear = function () {
      this.root = null;
   }
}
