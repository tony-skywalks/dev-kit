const fs = require('fs')
const path = require('path')
const { resolve } = require('path');

class FileCleaner {
    constructor(dir,options) {
        this.directory = dir;
        this.options = options;
    }
    async * getFiles(dir) {
        const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            const res = resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                yield* this.getFiles(res);
            } else {
                yield res;
            }
        }
    };
    
    async getFilesWithSize() {
        let sizeArry = {
            '0':0,
            '1':1000000,
            '2':5000000,
            '3':10000000,
            '4':10000000,
            '5':50000000,
            '6':100000000,
            '7':500000000,
            '7':1000000000,
        }
        let size = sizeArry[this.options.filter]
        var results = [];
        var i = 0;
        console.log(size)
        for await (const f of this.getFiles(this.directory)) {
            let s;
            if (this.options.filter == '0') {
                if (this.options.type == '0') {
                    s = fs.statSync(f).size
                    results[i] = {name:f,size:s}
                    i++;
                } else {
                    if (this.checkFileTypeSucceds(f) == true) {
                        s = fs.statSync(f).size
                        results[i] = {name:f,size:s}
                        i++;
                    }
                }
            } else {
                if (this.options.type == '0') {
                    s = fs.statSync(f).size
                    if (((s <= size) && (this.options.filter < 4)) || ((s >= size) && (this.options.filter >= 4)) ) {
                        results[i] = {name:f,size:s}
                        i++;
                    }
                } else {
                    if (this.checkFileTypeSucceds(f) == true) { 
                        s = fs.statSync(f).size
                        if (((s <= size) && (this.options.filter < 4)) || ((s >= size) && (this.options.filter >= 4)) ) {
                            results[i] = {name:f,size:s}
                            i++;
                        }
                    }
                }
            }
        }
        if (this.options.sort == 1) {
            results = this.sortArrayWithSize(results)
        } else if (this.options.sort == 2) {
            results = this.sortArrayWithSize(results).reverse()
        } else if (this.options.sort == 3) {
            results = this.sortArrayWithName(results)
        } else if (this.options.sort == 4) {
            results = this.sortArrayWithName(results).reverse()
        }
        return results
    }
    
    sortArrayWithSize(arr) {
        for (let i = 0; i < arr.length; i++) {
            let lowest = i
            for (let j = i +1; j < arr.length; j++) {
                if (arr[lowest].size > arr[j].size) {
                    lowest = j
                }        
            }
            
            if (lowest !== i) {
                let temp = arr[i]
                arr[i] = arr[lowest]
                arr[lowest] = temp
            }
        }
        return arr
    }
    
    checkFileTypeSucceds(file) {
        
        images = ['.jpeg','.jpg','.png','.gif','.tiff','.webp','.svg','.ico'] 
        videos = ['.mp4','.mov','.avi','.mkv','.3gp'] 
        extension = path.extname(file)
        if (this.options.type == '1') {
            if (images.includes(extension)) {
                return true
            }
        } else if (this.options.type == '2') {
            if (videos.includes(extension)) {
                return true
            }
        } else {
            return true
        }
        return false
    }
    
    
    sortArrayWithName(arr) {
        for (let i = 0; i < arr.length; i++) {
            let lowest = i
            
            for (let j = i +1; j < arr.length; j++) {
                if (arr[lowest].name.localeCompare(arr[j].name) == 1) {
                    lowest = j
                }        
            }
            
            if (lowest !== i) {
                let temp = arr[i]
                arr[i] = arr[lowest]
                arr[lowest] = temp
            }
        }
        return arr
    }
}

exports.FileCleaner = FileCleaner