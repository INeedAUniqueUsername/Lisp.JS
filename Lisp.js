var code;
//var code = "(block (result1 result2) (set result1 (add 1 5)) (set result2 (add 5 6)))";
//var code = "(divide (add (multiply 5 21) (divide 1 10) (add 1) 2 (subtract 0 10)) 100)";
//code = '(add (set a 1000) a (multiply a a))';
//code = '(list (add 1 2 3) (list 1 "a" 3) 2 "a")';
//code = '(at (append (list 1 2 3) (list 1 2 3 4)) 0)';
//code = '(if false (power 2 2 2 2) 5)';
code = '(or 1 2 (and 1 2 3 0))'
var indent = function(level) {
    var result = '';
    for(var i = 0; i < level; i++)  {
        result += '-';
    }
    return result;
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
var globals = {
    add: function(args) {
        let sum = 0;
        for(let i = 0; i < args.length; i++) {
            sum += parseFloat(eval(args[i]));
        }
        return sum;
    },
    subtract: function(args) {
        let result = parseFloat(eval(args[0]));
        for(let i = 1; i < args.length; i++) {
            result -= parseFloat(eval(args[i]));
        }
        return result;
    },
    multiply: function(args) {
        let result = parseFloat(eval(args[0]));
        for(let i = 1; i < args.length; i++) {
            result *= parseFloat(eval(args[i]));
        }
        return result;
    },
    divide: function(args) {
        let result = parseFloat(eval(args[0]));
        for(let i = 1; i < args.length; i++) {
            result /= parseFloat(eval(args[i]));
        }
        return result;
    },
    //Takes arguments base, e1, e2, e3, ... where result = (((base^e1)^e2)^e3)^e...
    power: function(args) {
        let base = eval(args[0]);
        let result = 1;
        for(let i = 1; i < args.length; i++) {
            let exponent = eval(args[i]);
            for(let j = 0; j < exponent; j++) {
                result *= base;
            }
            base = result;
            result = 1;
        }
        return base;
    },
    set: function(args) {
        if(args.length < 2) {
            return 'Missing arguments';
        } else {
            return (globals[args[0]] = eval(args[1]));
        }
    },
    delete: function(args) {
        if(args.length < 1) {
            return 'Missing argument';
        } else {
            let value = globals[args[0]]
            delete globals[args[0]];
            return value;
        }
    },
    cat: function(args) {
        let result = '';
        for(let i = 0; i < args.length; i++) {
            result += destring(eval(args[i]));
        }
        return '"' + result + '"';
    },
    list: function(args) {
        let result = [];
        for(let i = 0; i < args.length; i++) {
            result.push(eval(args[i]));
        }
        return result;
    },
    append: function(args) {
        let result = [];
        for(let i = 0; i < args.length; i++) {
            let list = eval(args[i]);
            for(let j = 0; j < list.length; j++) {
                result.push(list[j]);
            }
        }
        return result;
    },
    at: function(args) {
        let list = eval(args[0]);
        let index = eval(args[1]);
        //console.log("List: " + list);
        //console.log("Index: " + index);
        return list[index];
    },
    length: function(args) {
        let list = eval(args[0]);
        return list.length;
    },
    if: function(args) {
        let condition = eval(args[0]);
        let path_true = args[1];
        let path_false = args[2];
        return truth(condition) ? eval(path_true) : eval(path_false);
    },
    and: function(args) {
        let result;
        for(let i = 0; i < args.length; i++) {
            if(!truth(result = eval(args[i]))) {
                return false;
            }
        }
        return result;
    },
    or: function(args) {
        let result;
        for(var i = 0; i < args.length; i++) {
            if(truth(result = eval(args[i]))) {
                return result;
            }
        }
        return false;
    },
    xor: function(args) {
        let trues = 0;
        for(var i = 0; i < args.length; i++) {
            if(truth(eval(args[i]))) {
                trues++;
            }
        }
        return trues%2 === 1;
    },
    not: function(args) {
        return !truth(eval(args[0]));
    },
    nand: function(args) {
        return !globals.and(args);
    },
    nor: function(args) {
        return !globals.or(args);
    },
    xnor: function(args) {
        return !globals.xor(args);
    },
    //(branch condition1 path1 condition2 path2 condition 3 path3 ... [default])
    //If condition1 is true, then eval path1
    //Else if condition2 is true, then eval path2
    //Else if condition3 is true, then eval path3
    //...
    //Else run default
    branch: function(args) {
        for(let i = 0; i+1 < args.length; i++) {
            if(eval(args[i])) {
                return eval(args[i+1]);
            }
        }
        //Odd number of arguments means there's a default path
        if(args.length%2 == 1) {
            return eval(args[args.length-1]);
        }
    },
    //(switch value case1 path1 case2 path2 case3 path3 ... [default]) -> result of path
    //If value === case1, then eval path1
    //Else if value === case2, then eval path2
    //Else if value === case 3, then eval path3
    //Else eval default
    switch: function(args) {
        let value = eval(args[0]);
        for(let i = 1; i < args.length; i++) {
            if(value === eval(args[i])) {
                return eval(args[i+1]);
            }
        }
        //Even number of arguments means there's a default path
        if(args.length%2 == 0) {
            return eval(args[args.length-1]);
        }
    },
    //(race path1 path2 path3 ... pathn)
    //Evaluates all expressions in random order, race condition guaranteed
    race: function(args) {
        let result;
        for(let i = args.length-1; i > -1; i--) {
            let roll = Math.floor(Math.random() * (i + 1));
            [args[i], args[roll]] = [args[roll], args[i]];
            result = eval(args[i]);
        }
        return result;
    },
    //(diverge path1 path2 path3 ... pathn)
    //Diverges the timeline towards one of the paths
    diverge: function(args) {
        return eval(args[Math.floor(Math.random() * args.length)]);
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
                    globals[name] = eval(locals[1]);
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
            result = eval(args[i]);
        }
        for(let previousGlobal in previousGlobals) {
            globals[previousGlobal] = previousGlobals[previousGlobal];
        }
        return result;
    },
    eval: function(code) {
        if(!Array.isArray(code)) {
            if(code === 'true') {
                return true;
            } else if(code === 'false') {
                return false;
            } else if(typeof code === 'string' && code.startsWith('"') && code.endsWith('"')) {
                //Ignore strings
                return code;
            }
            let result;
            if((result = parseFloat(code) || parseInt(code)) || result === 0) {
                return result;
            }
            //May be looking at a global
            result = globals[code];
            if(result) {
                console.log(code + ' -> ' + result);
                return result;
            }
            return 'no binding for symbol [' + code + '] ### ' + decode(code) + ' ### ';
        } else {
            let command = code[0];
            let args = [];
            for(var i = 1; i < code.length; i++) {
                args.push(code[i]);
            }
            
            //See if we're calling a function with our first argument
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
                return 'not a function [' + command + '] ### ' + decode(code) + ' ### ';
            } else {
                return 'no binding for symbol [' + command + '] ### ' + decode(code) + ' ### ';
            }
        }
    },
    link: function(codeString) {
        if(Array.isArray(codeString)) {
            codeString = decode(codeString);
        }
        console.log('Parsing Code: ' + codeString);
        let layers = [];
        layers.push([]);
        let parsingSymbol = false;
        let parsingString = false;
        let parsingLiteral = false;
        let parsingLiteralType = '';
        let literalListParenCount = 0;

        for(let i = 0; i < codeString.length; ++i) {
            let c = codeString.charAt(i);
            let layer = layers[layers.length-1];

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
                    //If we just started parsing this literal and the first char we find after the apostrophe is am open parenthesis, then we are looking at a list.
                    if(!parsingLiteralType) {
                        parsingLiteralType = 'list';
                    }

                    //If we're already parsing a literal list structure, then we found a nested list structure.
                    if(parsingLiteralType === 'list') {
                        layer[layer.length-1] += c;
                    } else {
                        //Immediately transition to parsing a new list literal
                        //layers[layers.length-1].push(c);
                        parsingLiteralType = 'list';
                        layers[layers.length-1].push('\'');
                        i--;

                        //Prepare the string for use
                        layer[layer.length-1] = '"' + layer[layer.length-1].substring(1) + '"';
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
    },
    help: function(args) {
        var arg = args[0];
        if(arg) {
            return help[arg] || (globals[arg] ? ('No help text available for ' + arg) : ('Unknown symbol [' + arg + ']'))
        } else {
            let result = '';
            let globalKeys = Object.keys(globals);
            globalKeys.sort();
            for(let i = 0; i < globalKeys.length; i++) {
                var g = globalKeys[i];
                result += '\n' + (help[g] || 'No help text available for ' + g);
            }
            return result;
        }
        
    }
};
var help = {
    add: '(add n1 n2 n3 ... nn) -> n1 + n2 + n3 + ... + nn',
    subtract: '(subtract n1 n2 n3 ... nn) -> n1 - n2 - n3 - ... - nn',
    multiply: '(multiply n1 n2b n3 ... nn) -> n1 * n2 * n3 * ... * nn',
    divide: '(divide n1 n2 n3 ... nn) -> n1 / n2 / n3 / ... / nn',
    power: '(power n e1 e2 e3 ... en) -> (((((n)^e1)^e2)^e3)^...)^en',
    set: '(set var value) -> value; sets global named by var',
    delete: '(delete var) -> value of global named by var before deleting',
    cat: '(cat string1 string2 string3 ... stringn) -> concatenated string',
    list: '(list item1 item2 item3 ... itemn) -> list of items',
    append: '(append list1 list2 list3 ... listn) -> combined list',
    at: '(at list index) -> item in list at index',
    length: '(length list) -> length of list',
    if: '(if condition path1 path2) -> if true, result of evaluating path1; otherwise, result of evaluating path2',
    and: '(and condition1 condition2 condition3 ... conditionn) -> True if all conditions are True; otherwise False. Short circuit evaluation.',
    or: '(or condition1 condition2 condition3 ... conditionn) -> True if at least one condition is True; otherwise False. Short circuit evaluation.',
    xor: '(xor condition1 condition2 condition3 ...) -> True if number of true expressions is odd',
    nand: '(nand condition1 condition2 condition3 ... conditionn) -> True if at least one condition is False; otherwise True. Short circuit evaluation.',
    nor: '(nor condition1 condition2 condition3 ... conditionn) -> True if all conditions are False; otherwise True. Short circuit evaluation.',
    xnor: '(xnor condition1 condition2 condition3 ...) -> True if number of true expressions is even; otherwise False.',
};
let truth = function(condition) {
    return condition || condition === 0;
};
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
var eval = function(code) {
    return globals.eval(code);
}
var parse = function(codeString) {
    return globals.link(codeString);
}
console.log(eval(parse(code)));
exports.run = function(code) { return eval(parse(code)); };