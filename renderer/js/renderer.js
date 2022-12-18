const search = document.querySelector('#search-btn')
const appendHere = document.querySelector('#append-here')


search.addEventListener('click',(e) => {
    ipcRenderer.send('select:location')
})

ipcRenderer.on('get:results',(data,e) => {
    createTable(data)
})

function createTable(data) {
    console.log(data);
    html ='<table class="mt-5 table"><thead class="table-dark"><tr><th>#</th><th>Filename</th><th>Size</th><th>Actions</th></tr></thead><tbody>'
    let i = 1
    data.res.forEach(element => {
        html += `<tr><td>${i}</td><td>${element.name}</td><td>${element.size}</td><td><button attr-file="${element.name}" class="del-btn btn btn-sm btn-danger"><i class="fa fa-trash"></i></button></td></tr>`
        i++
    });

    html += '</tbody></table>'
    appendHere.innerHTML = html
}

function deleteFile(file) {
    Swal.fire({
        icon:'warning',
        title: 'Do you want to continue?',
        showCancelButton: true,
        confirmButtonText: 'Delete',
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('File Deleted!', '', 'success')
            ipcRenderer.send('delete:file',{file:file})
        }
    })
}

$('#append-here').on('click','.del-btn',(e) => {
    let file = $(e.target).attr('attr-file')
    deleteFile(file)
    console.log($('table tr').length)
    if ($('table tr').length === 2) {
        $(e.target).parents('table').remove()
    } else {
        $(e.target).parents('tr').remove()
    }
})