// Обработчики событий

$(document).on("numbers_rendered", function () {
   portals.open(2000);
   numbers.copyUp("numbers_input", 1000);
});

$(document).on("portals_opened sort_numbers_enter", function (e, sorted) {
   if (!sorted && e.type != "sort_numbers_enter") numbers.move("right", 500, 1500);
   if (e.type == "sort_numbers_enter") numbers.move("left", 0, 1500);
});

$(document).on("numbers_collide", function() {
   graph.drawArray(numbers.array());
});

$(document).on("portals_closed node_order_end", function () {
   tree_builder.setNumbers(numbers.array());
   tree_builder.buildOrder();
});

$(document).on("next_node_in_order", function () {
   tree_builder.buildBranch();
});

$(document).on("start_sort", function () {
   startSort();
})