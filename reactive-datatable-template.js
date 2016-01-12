Template.ReactiveDatatable.rendered = function() {
    var data = this.data;
    console.log(data.tableData);
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
    
    dt.on('draw.dt', function(e, settings) {
        reactiveDataTable.drawCallback(settings);
    });

    $(table).on('click', 'tbody tr', function(e){
        var $e = $(e.currentTarget);
        if(!($e.hasClass('add-row') || $e.hasClass('edit-row'))){
            if($e.hasClass('selected')){
                $e.removeClass('selected');
            }
            else{
                $(".dataTable tbody tr.selected").removeClass('selected');
                $(e.currentTarget).addClass('selected');
            }
        }
    });

    $(table).on('dblclick', 'tbody tr td', function(e){
        reactiveDataTable.renderEditForm(e);
    });

    /*
     * column control events
     */

    $(table).on('keyup', 'tbody tr.edit-row .column-control', _.throttle(function(e){
        if(($(e.currentTarget).prop('tagName').toLowerCase() == 'input' && $(e.currentTarget).attr('type').toLowerCase() == 'text')
          || $(e.currentTarget).prop('tagName').toLowerCase() == 'textarea'){
            reactiveDataTable.updateRow(e);
        }
    }, 300));

    $(table).on('change', 'tbody tr.edit-row .column-control', function(e){
        if($(e.currentTarget).prop('tagName').toLowerCase() == 'select'){
            reactiveDataTable.updateRow(e);
        }
    });

    $(table).on('click', 'tbody tr.edit-row .column-control', function(e){
        if($(e.currentTarget).prop('tagName').toLowerCase() == 'input' && $(e.currentTarget).attr('type').toLowerCase() == 'checkbox'){
            reactiveDataTable.updateRow(e);
        }
    });

    $(table).on('blur', 'tbody tr.add-row .column-control', function(e){
        setTimeout(function(){// need to delay to detect next control with focus
            reactiveDataTable.triggerSave(e);
        },300);
    });

    $(table).on('keyup', 'tbody tr.add-row .column-control', function(e){
        if(e.keyCode == 27){ // esc is pressed
            $(table).find('tbody tr.add-row').remove();
//             e.stopPropagation();
        }
    });

    $(table).on('blur', 'tbody tr.edit-row .column-control', function(e){
        setTimeout(function(){// need to delay to detect next control with focus
            reactiveDataTable.removeEdit(e);
        },300);
    });

    $(table).on('keyup', 'tbody tr.edit-row .column-control', function(e){
        if(e.keyCode == 27){ // esc is pressed
            $(table).find('tbody tr.editing').removeClass('editing');
            $(table).find('tbody tr.edit-row').remove();
//             e.stopPropagation();
        }
    });

    // Create `Add` button
    var btn_add = document.createElement('button');
    btn_add.className = 'btn-add';
    btn_add.addEventListener('click', function(e){
        reactiveDataTable.renderAddForm();
    });
    this.$('.datatable-controls').append(btn_add);

    var btn_delete = document.createElement('button');
    btn_delete.className = 'btn-delete';
    btn_delete.addEventListener('click', function(e){
        reactiveDataTable.triggerDelete(e);
    });
    this.$('.datatable-controls').append(btn_delete);

//     var btn_refresh = document.createElement('button');
//     btn_refresh.className = 'btn-refresh';
//     btn_refresh.addEventListener('click', function(e) {
//         reactiveDataTable.refresh(e);
//     });

    dt.on('order.dt', function(e, settings) {
        // show hidden editing row
        $(this).find('tbody tr.editing').removeClass('editing');
    });

    dt.on('search.dt', function(e, settings) {
        // show hidden editing row
        $(this).find('tbody tr.editing').removeClass('editing');
    });

    dt.on('page.dt', function(e, settings) {
        // show hidden editing row
        $(this).find('tbody tr.editing').removeClass('editing');
    });

    this.autorun(function() {
        reactiveDataTable.update(data.tableData());
    });
};