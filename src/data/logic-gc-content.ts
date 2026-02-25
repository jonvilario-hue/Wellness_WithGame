
export const gcLogicTrials = [
    // TIER 1
    {
        id: 'gc-logic-t1-01', tier: 1,
        snippet: 'let mood = "happy";\nif (mood == "happy") {\n  return "smile";\n} else {\n  return "frown";\n}',
        question: 'If mood is "happy", what does this code return?',
        options: ["smile", "frown", "happy", "error"],
        correctIndex: 0,
        conceptTag: "if",
        explanationOnCorrect: "Correct! The 'if' statement checks the condition. Since mood is 'happy', the code takes the first path.",
        explanationOnWrong: "The 'if' statement checks if the condition is true. Here, `mood == \"happy\"` is true, so the first block runs, returning 'smile'."
    },
    {
        id: 'gc-logic-t1-02', tier: 1,
        snippet: 'let x = 10;\nlet y = 3;\nlet result = x + y;',
        question: "What is the value of 'result'?",
        options: ["13", "7", "30", "10 + 3"],
        correctIndex: 0,
        conceptTag: "+",
        explanationOnCorrect: "Correct! The '+' operator performs addition.",
        explanationOnWrong: "The code adds x (10) and y (3), storing the sum, 13, in the 'result' variable."
    },
    {
        id: 'gc-logic-t1-03', tier: 1,
        snippet: 'let isRaining = true;\nif (isRaining == true) {\n  return "umbrella";\n}',
        question: 'What keyword means "check a condition"?',
        options: ["if", "let", "return", "true"],
        correctIndex: 0,
        conceptTag: "if",
        explanationOnCorrect: "Exactly. 'if' is used to create a conditional block of code.",
        explanationOnWrong: "'if' is the keyword used to execute code only if a specified condition is true."
    },
    // ... add at least 12 more Tier 1 trials
    {
        id: 'gc-logic-t1-04', tier: 1,
        snippet: 'let a = 5;\nlet b = 5;\nif (a == b) {\n  return true;\n}',
        question: 'What does this code return?',
        options: ["true", "false", "5", "error"],
        correctIndex: 0,
        conceptTag: "==",
        explanationOnCorrect: "Correct. The '==' operator checks if two values are equal.",
        explanationOnWrong: "Since `a` and `b` are both 5, the condition `a == b` is true."
    },


    // TIER 2
    {
        id: 'gc-logic-t2-01', tier: 2,
        snippet: 'function double(x) {\n  return x * 2;\n}\nlet result = double(5);',
        question: "What is the value of 'result'?",
        options: ["10", "5", "25", "x * 2"],
        correctIndex: 0,
        conceptTag: "function",
        explanationOnCorrect: "Correct! The function 'double' was called with 5, and it returned 5 * 2.",
        explanationOnWrong: "A function is a reusable block of code. Here, `double(5)` runs the code inside with `x` being 5, so it returns 10."
    },
    {
        id: 'gc-logic-t2-02', tier: 2,
        snippet: 'let numbers = [1, 2, 3, 4, 5];\nlet big = numbers.filter(n => n > 3);',
        question: "What does the 'big' array contain?",
        options: ["[4, 5]", "[1, 2, 3]", "[3, 4, 5]", "[5]"],
        correctIndex: 0,
        conceptTag: "filter",
        explanationOnCorrect: "Correct. '.filter()' creates a new array with all elements that pass the test.",
        explanationOnWrong: "The '.filter()' method goes through each number and keeps only the ones where `n > 3` is true."
    },
    {
        id: 'gc-logic-t2-03', tier: 2,
        snippet: 'let words = ["hi", "bye"];\nlet upper = words.map(w => w.toUpperCase());',
        question: "What is upper[0]?",
        options: ["HI", "hi", "HI BYE", "undefined"],
        correctIndex: 0,
        conceptTag: "map",
        explanationOnCorrect: "Correct. '.map()' creates a new array by applying a function to each element. `upper[0]` is the first element of the new array.",
        explanationOnWrong: "The '.map()' method transforms each element. 'hi' becomes 'HI', and 'bye' becomes 'BYE'. The first element is 'HI'."
    },
    // ... add at least 12 more Tier 2 trials


    // TIER 3
    {
        id: 'gc-logic-t3-01', tier: 3,
        snippet: 'typeof null',
        question: "What does this expression return?",
        options: ["\"object\"", "\"null\"", "\"undefined\"", "\"boolean\""],
        correctIndex: 0,
        conceptTag: "typeof",
        explanationOnCorrect: "Correct! This is a famous, long-standing bug in JavaScript's history.",
        explanationOnWrong: "This is a famous JavaScript quirk. For historical reasons, `typeof null` returns 'object', which is technically incorrect but preserved for compatibility."
    },
    {
        id: 'gc-logic-t3-02', tier: 3,
        snippet: '"" == false',
        question: "Does this expression evaluate to true or false?",
        options: ["true (they're both falsy)", "false (different types)", "error", "undefined"],
        correctIndex: 0,
        conceptTag: "==",
        explanationOnCorrect: "Correct. With `==`, JavaScript performs type coercion. Since both an empty string and `false` are 'falsy', they are considered equal.",
        explanationOnWrong: "The loose equality operator `==` converts operands to the same type before comparing. An empty string and `false` are both considered 'falsy' and thus equal."
    },
    {
        id: 'gc-logic-t3-03', tier: 3,
        snippet: 'let a = [1, 2, 3];\nlet b = [1, 2, 3];\na == b;',
        question: "What does a == b evaluate to?",
        options: ["false (different objects)", "true (same values)", "error", "undefined"],
        correctIndex: 0,
        conceptTag: "===",
        explanationOnCorrect: "Correct. `==` checks for object identity, not value equality. `a` and `b` are two separate objects in memory.",
        explanationOnWrong: "In JavaScript, arrays and objects are compared by reference, not by value. Since `a` and `b` are two distinct objects in memory, they are not equal."
    },
    {
        id: 'gc-logic-t3-04', tier: 3,
        snippet: 'function makeCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\nlet counter = makeCounter();\ncounter();\ncounter();',
        question: "What does counter() return on the second call?",
        options: ["2", "1", "0", "undefined"],
        correctIndex: 0,
        conceptTag: "closure",
        explanationOnCorrect: "Correct! The inner function 'closes over' the `count` variable, so it remembers and increments its value across calls.",
        explanationOnWrong: "This is a closure. The inner function maintains a reference to its parent's `count` variable, so each call increments the same `count`."
    }
    // ... add at least 11 more Tier 3 trials
];
