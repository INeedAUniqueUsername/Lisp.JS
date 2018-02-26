var lisp = require('./Lisp.js');

let i = process.openStdin();
i.addListener("data", function(d) {
    try {
        console.log(lisp.run(d.toString().trim()));
    } catch(error) {
        console.log(error);
    }
});