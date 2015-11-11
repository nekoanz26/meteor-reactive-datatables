ReactiveDatatable = function(options) {
	var self = this;

	this.options = options = _.defaults(options, {
		// Any of these can be overriden by passing an options
		// object into your ReactiveDatatable template (see readme)
		stateSave: true,
		stateDuration: -1, // Store data for session only
		pageLength: 5,
		lengthMenu: [3, 5, 10, 50, 100],
		columnDefs: [{ // Global default blank value to avoid popup on missing data
			targets: '_all',
			defaultContent: '–––',
            render: function(cellData, renderType, currentRow, meta) {
                return self.renderValue(cellData, renderType, currentRow, meta);
            }
		}],
		stateLoadParams: function(settings, data) {
			// Make it easy to change to the stored page on .update()
			self.page = data.start / data.length;
		},
        mode: 0, // 0 - View  1 - Add  2 - Edit
	});
};

ReactiveDatatable.prototype.update = function(data) {
	if (!data) return;
	var self = this;
    var table = self.datatable.context[0].nTable;
    var edit_form = $(table).find('.edit-row');
    var last_index = -1;
    var last_id = null;
    var focus_index = 0;
    if(edit_form.length){
        var focused = $(table).find('tbody tr.edit-row td .column-control:focus');
        if(focused.length){
            var td = self.getParent(focused,'td');
            focus_index = td.index();
        }
        // get id of the currently editing row
        last_index = edit_form.index() - 1;
        var d = self.datatable.rows({page:'current'}).data()[last_index];
        last_id = d._id;
    }
	self.datatable
		.clear()
		.rows.add(data)
		.draw(false)
		.page(self.page || 0) // XXX: Can we avoid drawing twice?
		.draw(false);		  // I couldn't get the page drawing to work otherwise
    if(last_id != null){
        // re-render edit form
        var d = self.datatable.rows({page:'current'}).data()[last_index];

        if(/*d.length  && */d._id == last_id){
            var table = self.datatable.context[0].nTable;
            var dt = self.datatable.context[0];
            var columns = dt.aoColumns;

            var values = [];
            var tr = $(table).find('tbody tr:eq('+last_index+')');
            var cols = tr.find("td");


            $.each(cols, function(ind, col){
                values[ind] = $(col).html();
            });

            var _form = self.createForm(columns, 1, values);
            $(tr).addClass('editing').after(_form);
            var control = $(table).find('tbody tr.edit-row td:eq('+focus_index+') .column-control');

            $(control).focus(function(){
                // If this function exists...
                if($(this).prop("tagName").toLowerCase() == 'textarea'
                   || ($(this).prop("tagName").toLowerCase() == 'input' && $(this).attr('type').toLowerCase() == 'text' )){
                    if (this.setSelectionRange)
                    {
                        // ... then use it
                        // (Doesn't work in IE)

                        // Double the length because Opera is inconsistent about whether a carriage return is one character or two. Sigh.
                        var len = $(this).val().length * 2;
                        this.setSelectionRange(len, len);
                    }
                    else
                    {
                        // ... otherwise replace the contents with itself
                        // (Doesn't work in Google Chrome)
                        $(this).val($(this).val());
                    }
                }
            });

            $(control).focus();
        }
    }

};

ReactiveDatatable.prototype.triggerSave = function (e) {
    var self = this;
    var dt = self.datatable.context[0];
    var table = dt.nTable;
    var _form = $(table).find('tr.add-row');
    if(_form.length && !$(table).find('tbody :focus').hasClass('column-control')){
        var columns = dt.aoColumns;
        var controls = $(_form).find('td');
        var valid = true;
        var values = {};
        var field_index = -1;
        $.each(columns, function(ind, column){
            var c = $(controls[ind]);
            var val = c.find('.column-control').val();
            if(column.required){
                if(!val){
                    valid = false;
                    field_index = ind;
                    return;
                }
            }

            switch(column.type.toLowerCase()){
                case 'dropdown':
                    values[column.data] = parseInt(val);
                    break;
                case 'checkbox':
                    values[column.data] = c.find('.column-control').is(":checked") ? 1 : 0 ;
                    break;
                default:
                    values[column.data] = val;
                    break;
            }
        });
        if(valid){
            $(table).find('tr.add-row').remove();
            self.options.actions.insert(values);
        }
        else{
            alert(columns[field_index].title + ' is required');
            $($(table).find('.add-row .column-control:eq('+field_index+')')).focus();
        }
    }
};

ReactiveDatatable.prototype.triggerDelete = function (e) {
    var self = this;
    var $tr = self.datatable.$("tbody tr.selected");
    var edit_row = $(self.datatable.context[0].nTable).find("tbody tr.edit-row");

    if($tr.length){
        var index = $tr.index();
        var data = self.datatable.rows({page:'current'}).data()[index];
        var id = data._id;
        if(typeof id === 'object'){
            id = id._str;
        }
        self.options.actions.delete(id);
    }
    else if(edit_row.length){
        var index  = $(edit_row).index() - 1;
        var data = self.datatable.rows({page:'current'}).data()[index];
        var id = data._id;
        if(typeof id === 'object'){
            id = id._str;
        }
        self.options.actions.delete(id);
    }
};

ReactiveDatatable.prototype.renderEditForm = function(e) {
    var self = this;
    var tr = $(e.currentTarget);
    if(!tr.hasClass('add-row') && !tr.hasClass('edit-row')){
        var dt = self.datatable.context[0];
        var table = dt.nTable;
        $(table).find('tr.editing').removeClass('editing');
        $(table).find('tr.edit-row').remove();
        $(table).find('tr.add-row').remove();


        var ind = tr.index();
        var data = self.datatable.rows({page:'current'}).data()[ind];

        // Render form
        var dt = self.datatable.context[0];
        var columns = dt.aoColumns;
        var values = [];
        var cols = tr.find("td");

        $.each(cols, function(ind, col){
            values[ind] = $(col).html();
        });

        var _form = self.createForm(columns,1, values);

        $(e.currentTarget).addClass('editing').after(_form);
    }
};

ReactiveDatatable.prototype.updateRow = function(e) {
    var self = this;
    var control = $(e.currentTarget);
    var tr = self.getParent(control, 'tr');
    var ind = parseInt(tr.index()) - 1;
    var data = self.datatable.rows({page:'current'}).data()[ind];
    var id = data._id;
    if(typeof id === 'object'){
        id = id._str;
    }
    var values = {};
    var dt = self.datatable.context[0];
    var columns = dt.aoColumns;
    var cols = tr.find("td");

    $.each(columns, function(ind, column){
        var c = $(cols[ind]);
        var val = c.find('.column-control').val();
        switch(column.type.toLowerCase()){
            case 'dropdown':
                values[column.data] = parseInt(val);
                break;
            case 'checkbox':
                values[column.data] = c.find('.column-control').is(":checked") ? 1 : 0 ;
                break;
            default:
                values[column.data] = val;
                break;
        }
    });

    self.options.actions.update(id, values);
};

ReactiveDatatable.prototype.renderAddForm = function() {
    var self = this;
    var dt = self.datatable.context[0];
    var table = dt.nTable;

    if(!$(table).find('tbody .add-row').length){
        var dt = self.datatable.context[0];
        var table = dt.nTable;
        var columns = dt.aoColumns;
        tbody = $(table).find('tbody');
        $($(tbody).find('tr.edit-row')).remove();
        var _form = self.createForm(columns);

        tbody.append(_form);
    }
};

ReactiveDatatable.prototype.renderValue = function (cellData, renderType, currentRow, meta) {
    var self = this;
    var dt = self.datatable.context[0];
    var table = dt.nTable;
    var columns = dt.aoColumns;
    var column = columns[meta.col];
    switch(column.type.toLowerCase()){
        case 'checkbox':
            cellData = cellData ? 'Yes' : 'No';
            break;
        case 'actionbuttons':
            var _html = [];
//             $.each(column.buttons, function(ind, button){
//                 console.log(typeof button.image);
//             });
            $.each(column.buttons, function(ind, button){
                _html.push('<a href="'+(typeof button.href !== 'undefined' ? button.href : '')+'">');
                if(typeof button.image !== 'undefined'){
                    _html.push('<img src="'+button.image+'" class="img-responsive alt="'+button.text+'" title="'+button.text+'">');
                }
                else{
                    _html.push(button.text);
                }
                _html.push('</a>');
            });
            cellData = _html.join('');
            break;
    }
    return cellData;
};

ReactiveDatatable.prototype.refresh = function (e) {

};

ReactiveDatatable.prototype.getParent = function (elem, parentTag) {
    var self = this;
    $e = $(elem);
    $p = $e.parent();

    if(typeof $p === 'undefined'){
        return $e;
    }

    if($p.prop('tagName').toLowerCase() == parentTag.toLowerCase()){
        return $p;
    }
    else{
        return self.getParent($p, parentTag);
    }
};

ReactiveDatatable.prototype.createForm = function (columns, edit, values) {
    var _html = [];
    _html.push('<tr class="'+(edit ? 'edit' : 'add')+'-row">');
    $.each(columns, function(ind, column){
        var val = '';
        if(edit){
            switch(column.type){
                case 'dropdown':
                    val = parseInt(values[ind]);
                    break;
                case 'checkbox':
                    val = parseInt(values[ind]) || values[ind] == 'Yes' ? 1 : 0;
                    break;
                default:
                    val = values[ind];
                    break;
            }
        }
        _html.push('<td>');
        switch(column.type){
            case 'textarea':
                _html.push('<textarea name="'+column.data+'" class="form-control column-control" '+(column.required ? 'required' : '')+'>'+val+'</textarea>');
                break;
            case 'dropdown':
                var start = typeof column.min !== 'undefined' ? column.min : 1;
                var end = typeof column.max !== 'undefined' ? column.max : 10;
                _html.push('<select name="'+column.data+'" class="form-control column-control">');
                for(i=start;i<=end;i++){
                    _html.push('<option value="'+i+'" '+(val == i ? 'selected' : '')+'>'+i+'</option>');
                }
                _html.push('</select>');
                break;
            case 'checkbox':
//                 _html.push('<label class="checkbox-inline">');
                    _html.push('<input type="checkbox" name="'+column.data+'" class="form-control column-control" value="1" '+(val ? 'checked' : '')+'>');
//                 _html.push('</label>');
                break;
            default:
                _html.push('<input type="text" name="'+column.data+'" value="'+val+'" class="form-control column-control" '+(column.required ? 'required' : '')+'>');
                break;
            case 'actionButtons':

                break;
        }
        _html.push('</td>');
    });
    _html.push('</tr>');
    return _html.join('');
}
