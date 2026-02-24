
export const mathConceptQuestions = [
  // Definitions
  {
    level: 1, type: 'definition',
    question: "What is the term for a number that can only be divided by itself and 1?",
    options: ["Integer", "Composite Number", "Prime Number", "Rational Number"],
    answer: "Prime Number",
    explanation: "Prime numbers, like 2, 3, 5, and 7, have exactly two distinct positive divisors."
  },
  {
    level: 1, type: 'definition',
    question: "What do we call the result of a multiplication problem?",
    options: ["Sum", "Quotient", "Product", "Dividend"],
    answer: "Product",
    explanation: "The product is the result of multiplying two or more numbers."
  },
  {
    level: 2, type: 'definition',
    question: "In the equation y = mx + b, what does 'm' represent?",
    options: ["Y-intercept", "Slope", "X-coordinate", "Variable"],
    answer: "Slope",
    explanation: "The slope 'm' represents the rate of change, or the steepness of the line."
  },
  {
    level: 2, type: 'definition',
    question: "A polygon with four equal sides and four right angles is a...",
    options: ["Rhombus", "Rectangle", "Square", "Parallelogram"],
    answer: "Square",
    explanation: "A square has the properties of both a rhombus (equal sides) and a rectangle (right angles)."
  },
  {
    level: 3, type: 'definition',
    question: "What is the perimeter of a shape?",
    options: ["The space inside the shape", "The length of one side", "The distance around the outside of the shape", "The number of corners"],
    answer: "The distance around the outside of the shape",
    explanation: "Perimeter is calculated by adding up the lengths of all sides of a polygon."
  },
  {
    level: 4, type: 'definition',
    question: "Which of the following is NOT a property of a function?",
    options: ["Every input has exactly one output", "Can have multiple inputs mapping to the same output", "Can have one input mapping to multiple outputs", "Has a defined domain and range"],
    answer: "Can have one input mapping to multiple outputs",
    explanation: "The vertical line test confirms that a function must have only one output for each unique input."
  },
  {
    level: 5, type: 'definition',
    question: "The top number in a fraction is called the...",
    options: ["Denominator", "Numerator", "Quotient", "Divisor"],
    answer: "Numerator",
    explanation: "The numerator represents the number of parts being considered, while the denominator represents the total parts."
  },
  {
    level: 6, type: 'definition',
    question: "The Pythagorean theorem (a² + b² = c²) applies to which type of triangle?",
    options: ["All triangles", "Isosceles triangles", "Equilateral triangles", "Right-angled triangles"],
    answer: "Right-angled triangles",
    explanation: "It relates the lengths of the two shorter sides (legs) to the length of the longest side (hypotenuse) in a right triangle."
  },
  {
    level: 8, type: 'definition',
    question: "What is a 'derivative' in calculus?",
    options: ["The area under a curve", "The instantaneous rate of change of a function", "The total sum of a series", "The highest point on a graph"],
    answer: "The instantaneous rate of change of a function",
    explanation: "The derivative measures how a function's output changes as its input changes at a specific point."
  },
  {
    level: 9, type: 'definition',
    question: "A matrix with the same number of rows and columns is called a...",
    options: ["Vector", "Scalar", "Square matrix", "Identity matrix"],
    answer: "Square matrix",
    explanation: "A square matrix is a matrix with dimensions n x n."
  },
  
  // Analogies
  {
    level: 4, type: 'analogy',
    question: "Addition is to Subtraction as Multiplication is to ___?",
    options: ["Sum", "Product", "Division", "Exponentiation"],
    answer: "Division",
    explanation: "They are inverse operations."
  },
  {
    level: 4, type: 'analogy',
    question: "Radius is to Circle as ___ is to Square?",
    options: ["Diagonal", "Side length", "Area", "Perimeter"],
    answer: "Side length",
    explanation: "Both are fundamental linear measurements that define the scale of their respective shapes."
  },
  {
    level: 5, type: 'analogy',
    question: "Integer is to Real Number as ___ is to Word?",
    options: ["Sentence", "Phoneme", "Letter", "Language"],
    answer: "Letter",
    explanation: "An integer is a specific type of real number, just as a letter is a specific component of a word."
  },
  {
    level: 5, type: 'analogy',
    question: "X-axis is to Y-axis as Horizontal is to ___?",
    options: ["Diagonal", "Depth", "Vertical", "Plane"],
    answer: "Vertical",
    explanation: "This analogy relates the formal name of a coordinate axis to its directional description."
  },
  {
    level: 6, type: 'analogy',
    question: "y = mx + b is to a line as ___ is to a parabola?",
    options: ["y = x³", "a² + b² = c²", "y = ax² + bx + c", "sin(x)"],
    answer: "y = ax² + bx + c",
    explanation: "This is the standard form equation for a quadratic function, which graphs as a parabola."
  },
  {
    level: 7, type: 'analogy',
    question: "Derivative is to Rate of Change as ___ is to Area Under a Curve?",
    options: ["Limit", "Integral", "Function", "Slope"],
    answer: "Integral",
    explanation: "This analogy relates the two fundamental concepts of calculus: differentiation and integration."
  },
  {
    level: 7, type: 'analogy',
    question: "Commutative is to a + b = b + a as Associative is to ___?",
    options: ["a + 0 = a", "a * (b + c) = ab + ac", "a + (b + c) = (a + b) + c", "a * 1 = a"],
    answer: "a + (b + c) = (a + b) + c",
    explanation: "The associative property concerns how numbers are grouped, not their order."
  },
  {
    level: 8, type: 'analogy',
    question: "Scalar is to Magnitude as Vector is to ___?",
    options: ["Direction", "Magnitude and Direction", "Speed", "Number"],
    answer: "Magnitude and Direction",
    explanation: "A scalar has only magnitude, while a vector has both magnitude and direction."
  },
  {
    level: 9, type: 'analogy',
    question: "Matrix is to Table of Numbers as Determinant is to ___?",
    options: ["Another matrix", "A single value", "A vector", "The inverse"],
    answer: "A single value",
    explanation: "The determinant is a special number that can be calculated from a square matrix."
  },
  {
    level: 10, type: 'analogy',
    question: "Fibonacci is to Sequence as Euclid is to ___?",
    options: ["Algorithm", "Number", "Set", "Calculus"],
    answer: "Algorithm",
    explanation: "Euclid's Algorithm is a famous, ancient procedure for finding the greatest common divisor."
  },

  // Properties & Relationships
  {
    level: 7, type: 'property',
    question: "Which operation has the 'commutative' property, meaning order doesn't matter?",
    options: ["Subtraction", "Division", "Exponentiation", "Addition"],
    answer: "Addition",
    explanation: "a + b is always equal to b + a, but a - b is not always equal to b - a."
  },
  {
    level: 7, type: 'property',
    question: "What is the 'identity element' for multiplication?",
    options: ["0", "1", "-1", "The number itself"],
    answer: "1",
    explanation: "Any number multiplied by 1 remains unchanged (e.g., 5 * 1 = 5)."
  },
  {
    level: 8, type: 'property',
    question: "In set theory, what does the 'union' of two sets represent?",
    options: ["Only elements common to both sets", "All elements from both sets combined", "Elements in the first set but not the second", "The number of elements"],
    answer: "All elements from both sets combined",
    explanation: "The union (∪) combines all unique elements from the sets involved."
  },
  {
    level: 8, type: 'property',
    question: "Which of these numbers is irrational?",
    options: ["1/3", "√9", "0.25", "π (pi)"],
    answer: "π (pi)",
    explanation: "Irrational numbers cannot be expressed as a simple fraction; their decimal representation goes on forever without repeating."
  },
  {
    level: 8, type: 'property',
    question: "A function is considered 'one-to-one' if...",
    options: ["Every input maps to a unique output", "It forms a straight line", "It passes through the origin (0,0)", "It is symmetrical"],
    answer: "Every input maps to a unique output",
    explanation: "This means no two different inputs will ever produce the same output."
  },
  {
    level: 9, type: 'property',
    question: "The Distributive Property allows you to rewrite a(b + c) as:",
    options: ["ab + c", "a + bc", "ab + ac", "(a+b) * (a+c)"],
    answer: "ab + ac",
    explanation: "This property links multiplication and addition."
  },
  {
    level: 9, type: 'property',
    question: "What is true about the slopes of two perpendicular lines?",
    options: ["They are equal", "They are reciprocals", "They are negative reciprocals", "Their sum is 1"],
    answer: "They are negative reciprocals",
    explanation: "For example, if one line has a slope of 2, a line perpendicular to it will have a slope of -1/2."
  },
  {
    level: 10, type: 'property',
    question: "In logic, what does the 'contrapositive' of the statement 'If P, then Q' mean?",
    options: ["If Q, then P", "If not P, then not Q", "If not Q, then not P", "P and not Q"],
    answer: "If not Q, then not P",
    explanation: "The contrapositive is logically equivalent to the original statement."
  },
  {
    level: 10, type: 'property',
    question: "What defines an 'asymptote' of a function's graph?",
    options: ["A point where the graph crosses the y-axis", "A value that is not in the function's domain", "A line that the graph approaches but never touches", "The highest or lowest point of the graph"],
    answer: "A line that the graph approaches but never touches",
    explanation: "Asymptotes describe the long-term behavior of a function."
  },
  {
    level: 10, type: 'property',
    question: "What is a key feature of a 'limit' in calculus?",
    options: ["The exact value of a function at a point", "The value a function approaches as the input gets closer to a point", "The maximum value of a function", "A point where the function is undefined"],
    answer: "The value a function approaches as the input gets closer to a point",
    explanation: "Limits are fundamental to calculus and describe behavior near a point, not necessarily at the point itself."
  }
];
