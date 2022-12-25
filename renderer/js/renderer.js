const search = document.querySelector('#search-btn')
const appendHere = document.querySelector('#append-here')

let options = {
    filter:0,
    sort:0,
    type:0,
}

let searchResults = {};
let page = 1;

$('#select-sort').on('change',() => {
    options.sort = $('#select-sort').find(":selected").val()
    triggerSearch()
})

$('#select-filter').on('change',() => {
    options.filter = $('#select-filter').find(":selected").val()
    triggerSearch()
})

$('#select-type').on('change',() => {
    options.type = $('#select-type').find(":selected").val()
    triggerSearch()
})

search.addEventListener('click',(e) => {
    triggerSearch(true)
})

ipcRenderer.on('get:results',(data,e) => {
    page = 1
    searchResults = data
    let html = createTable(searchResults)
    if (searchResults.res.length > 0) {
        html += createPagination(page)
    }
    appendHere.innerHTML = html
})

ipcRenderer.on('on:error',(data,e) => {
    pushNotify('error',"Oops Something Went Wrong")
    appendHere.innerHTML = ''
})

ipcRenderer.on('set:searchbar',(data,e) => {
    $('#search-input').val(data.path)
})

$('#append-here').on('click','.pagination .page-link',(e) => {
    appendHere.innerHTML = '<div class="w-100 text-center"><img src="../assets/img/loading.gif" class="img-fluid"></div>'
    page = $(e.target).attr('attr-page')    
    let html = createTable(searchResults,page)
    if (searchResults.res.length > 0) {
        html += createPagination(page)
    }
    appendHere.innerHTML = html
})

$('#append-here').on('click','.del-btn',(e) => {
    let file = $(e.target).attr('attr-file')
    deleteFile(file)
    if ($('table tr').length === 2) {
        $(e.target).parents('table').remove()
    } else {
        $(e.target).parents('tr').remove()
    }
})

triggerSearch = (trigger=false) => {
    let dir = ''
    if ($('#search-input').val() !== ''){
        dir = $('#search-input').val()
    }
    ipcRenderer.send('select:location',{dir:dir,options:options,trigger:trigger})
    appendHere.innerHTML = '<div class="w-100 text-center"><img src="../assets/img/loading.gif" class="img-fluid"></div>'
}

createTable = (data,page=1) => {

    res = paginateData(data.res,page)
    
    let html = '';
    if (res.length > 0) {
        html +='<table class="mt-5 table"><thead class="table-dark"><tr><th>#</th><th>Filename</th><th>File Size</th><th>Actions</th></tr></thead><tbody>'
        let i = 1
        res.forEach(element => {
            html += `<tr><td>${i}</td><td>${getIco(element.name)} ${element.name.replace($('#search-input').val()+'/','')}</td><td>${formatBytes(element.size)}</td><td><button attr-file="${element.name}" class="del-btn btn btn-sm btn-danger"><i class="fa fa-trash"></i></button></td></tr>`
            i++
        });
    
        html += '</tbody></table>'
    } else {
        html += '<div class="w-100 text-center"><img src="../assets/img/empty.png" class="img-fluid"></div>'
    }
    return html
}

deleteFile = (file) => {
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

getIco = (file) => '<i class="fa-solid fa-file fs-6 text-primary"></i> '

formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

pushNotify = (mode,message) => {
    new Notify({
        status: mode,
        title: 'sky cleaner',
        text: message,
        effect: 'fade',
        speed: 300,
        customClass: null,
        customIcon: null,
        showIcon: true,
        showCloseButton: true,
        autoclose: true,
        autotimeout: 3000,
        gap: 20,
        distance: 20,
        type: 1,
        position: 'right top'
    })
}

paginateData = (data, page) => {
    return data.slice((page - 1) * 25, page * 25);
}

createPagination = (page) => {
    if (searchResults.res.length > 25) {
        let html = '<nav aria-label="..."><ul class="pagination pagination-circle">'
        if (page == 1) {
          html += '<li class="page-item disabled"><a class="page-link">Previous</a></li>'
        } else {
            html += `<li class="page-item"><a class="page-link" href="#!" attr-page="${parseInt(page) - 1}">Previous</a></li><li class="page-item"><a class="page-link" href="#!" attr-page="${parseInt(page) - 1}">${parseInt(page) - 1}</a></li>`
        }
        html += `<li class="page-item"><a class="page-link active" href="#!" attr-page="${page}">${page}</a></li>`
        if (searchResults.res.length > (25 * page + 1)) {
            html += `<li class="page-item"><a class="page-link" href="#!" attr-page="${parseInt(page) + 1}">${parseInt(page) + 1}</a></li><li class="page-item"><a class="page-link" href="#!" attr-page="${parseInt(page) + 1}">Next</a></li>`
            html += '</ul></nav>'
        }
        return html
    }
    return ''
} 

