Template.ReactiveDatatable.rendered = function() {
    var data = this.data;

    if (typeof data.tableData !== "function") {
        throw new Meteor.Error('Your tableData must be a function that returns an array via Cursor.fetch(), .map() or another (hopefully reactive) means')
    }

    var reactiveDataTable = new ReactiveDatatable(data.options);

    // Help Blaze cleanly remove entire datatable when changing template / route by
    // wrapping table in existing element (#datatable_wrap) defined in the template.
    var table = document.createElement('table');
    table.className = 'table dataTable';

    // Render the table element and turn it into a DataTable
    this.$('.datatable_wrapper').append(table);
    var dt = $(table).DataTable(data.options);
    reactiveDataTable.datatable = dt;

    dt.on('page.dt', function(e, settings) {
        var info = dt.page.info();
        reactiveDataTable.page = info.page;
    });

    // Create `Add` button
//     var btn_add = document.createElement('button');
//     btn_add.className = 'btn-add';

// //     btn_add.addEventListener('click', function(e){
// //         reactiveDataTable.renderAddForm();
// //     });

//     this.$('.datatable-controls').append(btn_add);

//     dt.on('order.dt', function(e, settings) {

//     });
};