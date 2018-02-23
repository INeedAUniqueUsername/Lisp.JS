//var code = "(block (result1 result2) (set result1 (add 1 5)) (set result2 (add 5 6)))";
//var code = "(divide (add (multiply 5 21) (divide 1 10) (add 1) 2 (subtract 0 10)) 100)";
//code = '(add (set a 1000) a (multiply a a))';
code = '\'aaaa(a b c)';
var indent = function(level) {
    var result = '';
    for(var i = 0; i < level; i++)  {
        result += '-';
    }
    return result;
}
var parse = function(codeString) {
    console.log('Parsing Code: ' + codeString);
    let layers = [];
    layers.push([]);
    let parsingSymbol = false;
    let parsingString = false;
    let parsingLiteral = false;
    let parsingLiteralType = '';
    let literalListParenCount = 0;
    let startLiteralList = false;
    
    for(let i = 0; i < codeString.length; ++i) {
        let c = codeString.charAt(i);
        let layer = layers[layers.length-1];
        
        if(startLiteralList) {
            startLiteralList = false;
            parsingLiteral = true;
            parsingLiteralType = 'list';
        }
        
        if(parsingLiteral) {
            if(c === ' ') {
                //Only applies if we're parsing a literal list
                if(literalListParenCount > 0) {
                    //We're processing a literal list structure, so we append the characters
                    layer[layer.length-1] += c;
                } else {
                    parsingLiteral = false;
                }
            } else if(c === ')') {
                //Only applies if we're parsing a literal list
                if(literalListParenCount > 0) {
                    layer[layer.length-1] += c;
                    literalListParenCount--;
                }
                if(literalListParenCount === 0) {
                    parsingLiteral = false;
                }
            } else if(c === '(') {
                if(!parsingLiteralType) {
                    parsingLiteralType = 'list';
                }
                
                if(parsingLiteralType === 'list') {
                    layer[layer.length-1] += c;
                } else {
                    //Immediately transition to parsing a new list literal
                    layers[layers.length-1].push(c);
                    parsingLiteralType = 'list';
                }
                literalListParenCount++;
            } else {
                if(!parsingLiteralType) {
                    parsingLiteralType = 'string';
                }
                layer[layer.length-1] += c;
            }
            
            //If we're done parsing a literal, then turn it into a string or a list
            if(!parsingLiteral) {
                if(parsingLiteralType === 'string') {
                    layer[layer.length-1] = '"' + layer[layer.length-1].substring(1) + '"';
                }
            }
        } else if(parsingString) {
            let layer = layers[layers.length-1];
            layer[layer.length-1] = layer[layer.length-1] + c;
            if(c === '"') {
                parsingString = false;
            }
        } else {
            if(c === '(') {
                if(parsingSymbol) {
                    console.log(indent(layers.length-1) + 'Parsed Symbol: ' + layer[layer.length-1]);
                }
                console.log(indent(layers.length-1) + 'Parsing Layer');
                
                layers.push([]);
                parsingSymbol = false;
            } else if(c === ')') {
                if(parsingSymbol) {
                    console.log(indent(layers.length-1) + 'Parsed Symbol: ' + layer[layer.length-1]);
                }
                layers[layers.length-2].push(layers.pop());
                
                console.log(indent(layers.length) + 'Parsed Layer: ' + decode(layer[layer.length-1]));
                
                parsingSymbol = false;
            } else if(c === ' ') {
                if(parsingSymbol) {
                    console.log(indent(layers.length-1) + 'Parsed Symbol: ' + layer[layer.length-1]);
                }
                
                parsingSymbol = false;
            } else if(c === '"') {
                console.log(indent(layers.length-1) + 'Parsing String');
                parsingString = true;
                layers[layers.length-1].push(c);
            } else if(c === '\'') {
                console.log(indent(layers.length-1) + 'Parsing Literal');
                parsingLiteral = true;
                parsingLiteralType = '';
                layers[layers.length-1].push(c);
            } else {
                if(parsingSymbol) {
                    //Append the char to the existing symbol name
                    layer[layer.length-1] = layer[layer.length-1] + c;
                    //console.log('Parsing Symbol');
                } else {
                    //Found a new symbol; start counting characters in its name
                    
                    //console.log('Parsing New Symbol');
                    parsingSymbol = true;
                    layers[layers.length-1].push(c);
                }
            }
        }
        
        
    }
    return layers[0][0];
}
var decode = function(code) {
    if(!Array.isArray(code)) {
        return code;
    } else if(code.length === 0) {
        return '()';
    } else if(code.length === 1) {
        return '(' + code[0] + ')';
    } else {
        var result = '(' + decode(code[0]);
        for(var i = 1; i < code.length; i++) {
            result += ' ' + decode(code[i]);
        }
        result += ')';
        return result;
    }
}
var decodeFirst = function(code) {
    if(!Array.isArray(code)) {
        return code;
    } else if(code.length === 0) {
        return '()';
    } else if(code.length === 1) {
        return '(' + code[0] + ')';
    } else {
        var result = '(' + decode(code[0]);
        for(var i = 1; i < code.length; i++) {
            result += ' ' + run(code[i]);
        }
        result += ')';
        return result;
    }
}
var globals = {
    add: function(args) {
        let sum = 0;
        for(let i = 0; i < args.length; i++) {
            sum += parseFloat(run(args[i]));
        }
        return sum;
    },
    subtract: function(args) {
        let result = parseFloat(run(args[0]));
        for(let i = 1; i < args.length; i++) {
            result -= parseFloat(run(args[i]));
        }
        return result;
    },
    multiply: function(args) {
        let result = parseFloat(run(args[0]));
        for(let i = 1; i < args.length; i++) {
            result *= parseFloat(run(args[i]));
        }
        return result;
    },
    divide: function(args) {
        let result = parseFloat(run(args[0]));
        for(let i = 1; i < args.length; i++) {
            result /= parseFloat(run(args[i]));
        }
        return result;
    },
    set: function(args) {
        if(args.length < 2) {
            return 'Missing arguments';
        } else {
            return (globals[args[0]] = run(args[1]));
        }
    },
    cat: function(args) {
        let result = '';
        for(let i = 0; i < args.length; i++) {
            result += destring(run(args[i]));
        }
        return '"' + result + '"';
    },
    block: function(args) {
        let locals = args[0];
        let previousGlobals = {};
        if(Array.isArray(locals)) {
            for(let i = 0; i < locals.length; i++) {
                let local = locals[i];
                if(Array.isArray(local)) {
                    if(local.length > 2) {
                        throw 'Too many arguments in local variable initialization';
                    }
                    let name = local[0];
                    previousGlobals[name] = globals[name];
                    globals[name] = run(locals[1]);
                } else {
                    previousGlobals[local] = globals[local];
                    delete globals[local];
                }
            }
        } else {
            throw 'First argument must be array of local variables';
        }
        let result = '';
        for(let i = 1; i < args.length; i++) {
            result = run(args[i]);
        }
        for(let previousGlobal in previousGlobals) {
            globals[previousGlobal] = previousGlobals[previousGlobal];
        }
        return result;
    }
}
var isString = function(string) {
    return typeof string === 'string' && string.startsWith('"') && string.endsWith('"');
}
var destring = function(string) {
    if(!(typeof string === 'string')) {
        return string;
    }
    if(string.startsWith('"')) {
        string = string.substring(1);
    }
    if(string.endsWith('"')) {
        string = string.substring(0, string.length-1);
    }
    return string;
}
var run = function(code) {
    if(!Array.isArray(code)) {
        //Ignore strings
        if(code.startsWith('"') && code.endsWith('"')) {
            return code;
        }
        
        //May be looking at a global
        let result = globals[code];
        if(result) {
            console.log(code + ' -> ' + result);
            return result;
        } else {
            return code;
        }
    } else {
        let command = code[0];
        let args = [];
        for(var i = 1; i < code.length; i++) {
            args.push(code[i]);
        }
        let func = globals[command];
        if(typeof func === 'function') {
            try {
                let result = func(args);
                console.log(decode(code) + ' -> ' + result);
                return result;
            } catch(error) {
                return error + ' ### ' + decode(code) + ' ###';
            }
            
        } else if(typeof func !== 'undefined') {
            return 'not a function [' + command + '] ### ' + decode(code) + ' ###';
        } else {
            return 'no binding for symbol [' + command + '] ### ' + decode(code) + ' ###';
        }
    }
}

console.log(run(parse(code)));
'done'
