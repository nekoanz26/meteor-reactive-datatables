Package.describe({
    name: 'nekoanz:reactive-datatables',
    summary: "Fast and reactive jQuery DataTables using standard Cursors / DataTables API. Supports Bootstrap 3.",
    version: "1.1.0",
    git: "https://github.com/nekoanz26/meteor-reactive-datatables"
});

Package.onUse(function(api) {
    api.versionsFrom('0.9.0');
    api.use(['templating','bootstrap'], 'client');
    api.addFiles([
        'jquery.dataTables.js',
        'reactive-datatables.js',
        'reactive-datatable-template.html',
        'reactive-datatable-template.js',
        'reactive-datatable.css',
    ], 'client');
});
