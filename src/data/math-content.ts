export const mathConceptQuestions = [
  // Level 1: Definitions
  {
    id: 'gcm-def-01', level: 1, type: 'definition',
    question: "What is the term for a number that can only be divided by itself and 1?",
    options: ["Integer", "Composite Number", "Prime Number", "Rational Number"],
    answer: "Prime Number",
    explanation: "Prime numbers, like 2, 3, 5, and 7, have exactly two distinct positive divisors."
  },
  {
    id: 'gcm-def-02', level: 1, type: 'definition',
    question: "What do we call the result of a multiplication problem?",
    options: ["Sum", "Quotient", "Product", "Dividend"],
    answer: "Product",
    explanation: "The product is the result of multiplying two or more numbers."
  },
  {
    id: 'gcm-def-03', level: 1, type: 'definition',
    question: "A polygon with four equal sides and four right angles is a...",
    options: ["Rhombus", "Rectangle", "Square", "Parallelogram"],
    answer: "Square",
    explanation: "A square has the properties of both a rhombus (equal sides) and a rectangle (right angles)."
  },
  {
    id: 'gcm-def-04', level: 1, type: 'definition',
    question: "What is the perimeter of a shape?",
    options: ["The space inside the shape", "The length of one side", "The distance around the outside of the shape", "The number of corners"],
    answer: "The distance around the outside of the shape",
    explanation: "Perimeter is calculated by adding up the lengths of all sides of a polygon."
  },
  {
    id: 'gcm-def-05', level: 1, type: 'definition',
    question: "The top number in a fraction is called the...",
    options: ["Denominator", "Numerator", "Quotient", "Divisor"],
    answer: "Numerator",
    explanation: "The numerator represents the number of parts being considered."
  },
  {
    id: 'gcm-def-06', level: 1, type: 'definition',
    question: "In the equation y = mx + b, what does 'b' represent?",
    options: ["Slope", "Y-intercept", "X-coordinate", "Variable"],
    answer: "Y-intercept",
    explanation: "The y-intercept is the point where the line crosses the vertical y-axis."
  },
  {
    id: 'gcm-def-07', level: 1, type: 'definition',
    question: "What does the 'L' represent in the Roman numeral system?",
    options: ["5", "50", "100", "500"],
    answer: "50",
    explanation: "L represents 50, C represents 100, and D represents 500."
  },
  {
    id: 'gcm-def-08', level: 1, type: 'definition',
    question: "An angle that is less than 90 degrees is called...",
    options: ["Obtuse", "Right", "Straight", "Acute"],
    answer: "Acute",
    explanation: "Acute angles are smaller than a right angle (90°)."
  },
  {
    id: 'gcm-def-09', level: 1, type: 'definition',
    question: "What is a 'variable' in algebra?",
    options: ["A number that is always the same", "The answer to a problem", "A symbol that represents an unknown value", "A type of equation"],
    answer: "A symbol that represents an unknown value",
    explanation: "Variables, like x or y, are used to represent quantities that can change or are unknown."
  },
  {
    id: 'gcm-def-10', level: 1, type: 'definition',
    question: "The set of all possible input values for a function is called its...",
    options: ["Range", "Domain", "Output", "Codomain"],
    answer: "Domain",
    explanation: "The domain defines the set of valid inputs for which the function is defined."
  },

  // Level 2: Properties & Classification
  {
    id: 'gcm-prop-01', level: 2, type: 'property',
    question: "Which operation has the 'commutative' property (order doesn't matter)?",
    options: ["Subtraction", "Division", "Exponentiation", "Addition"],
    answer: "Addition",
    explanation: "a + b is always equal to b + a, but a - b is not always equal to b - a."
  },
  {
    id: 'gcm-prop-02', level: 2, type: 'property',
    question: "What is the 'identity element' for multiplication?",
    options: ["0", "1", "-1", "The number itself"],
    answer: "1",
    explanation: "Any number multiplied by 1 remains unchanged (e.g., 5 * 1 = 5)."
  },
  {
    id: 'gcm-prop-03', level: 2, type: 'property',
    question: "In set theory, what does the 'intersection' of two sets represent?",
    options: ["Only elements common to both sets", "All elements from both sets combined", "Elements in the first set but not the second", "The number of elements"],
    answer: "Only elements common to both sets",
    explanation: "The intersection (∩) contains only the elements that exist in both sets."
  },
  {
    id: 'gcm-prop-04', level: 2, type: 'property',
    question: "Which of these numbers is irrational?",
    options: ["1/3", "√9", "0.25", "π (pi)"],
    answer: "π (pi)",
    explanation: "Irrational numbers cannot be expressed as a simple fraction; their decimal representation is non-repeating and non-terminating."
  },
  {
    id: 'gcm-prop-05', level: 2, type: 'property',
    question: "A function is considered 'one-to-one' if...",
    options: ["Every input maps to a unique output", "It forms a straight line", "It passes through the origin (0,0)", "It is symmetrical"],
    answer: "Every input maps to a unique output",
    explanation: "This means no two different inputs will ever produce the same output."
  },
  {
    id: 'gcm-prop-06', level: 2, type: 'property',
    question: "The Pythagorean theorem (a² + b² = c²) applies to which type of triangle?",
    options: ["All triangles", "Isosceles triangles", "Equilateral triangles", "Right-angled triangles"],
    answer: "Right-angled triangles",
    explanation: "It relates the lengths of the two shorter sides (legs) to the length of the longest side (hypotenuse)."
  },
  {
    id: 'gcm-prop-07', level: 2, type: 'property',
    question: "Two lines that are in the same plane and never intersect are called:",
    options: ["Perpendicular", "Skew", "Parallel", "Oblique"],
    answer: "Parallel",
    explanation: "Parallel lines have the same slope and never touch."
  },
  {
    id: 'gcm-prop-08', level: 2, type: 'property',
    question: "Which of the following is NOT a property of a function?",
    options: ["Every input has exactly one output", "Can have multiple inputs mapping to the same output", "Can have one input mapping to multiple outputs", "Has a defined domain and range"],
    answer: "Can have one input mapping to multiple outputs",
    explanation: "The vertical line test confirms that a function must have only one output for each unique input."
  },
  {
    id: 'gcm-prop-09', level: 2, type: 'property',
    question: "A 'vector' is a mathematical object that has...",
    options: ["Only magnitude", "Only direction", "Magnitude and direction", "Only position"],
    answer: "Magnitude and direction",
    explanation: "In contrast, a 'scalar' has only magnitude."
  },
  {
    id: 'gcm-prop-10', level: 2, type: 'property',
    question: "What is the relationship between the radius and the diameter of a circle?",
    options: ["They are equal", "The radius is half the diameter", "The diameter is half the radius", "The radius is π times the diameter"],
    answer: "The radius is half the diameter",
    explanation: "The diameter is the distance across the circle through its center, while the radius is from the center to the edge."
  },

  // Level 3: Analogies & Abstract Relationships
  {
    id: 'gcm-ana-01', level: 3, type: 'analogy',
    question: "Addition is to Subtraction as Multiplication is to ___?",
    options: ["Sum", "Product", "Division", "Exponentiation"],
    answer: "Division",
    explanation: "They are inverse operations."
  },
  {
    id: 'gcm-ana-02', level: 3, type: 'analogy',
    question: "Radius is to Circle as ___ is to Square?",
    options: ["Diagonal", "Side length", "Area", "Perimeter"],
    answer: "Side length",
    explanation: "Both are fundamental linear measurements that define the scale of their respective shapes."
  },
  {
    id: 'gcm-ana-03', level: 3, type: 'analogy',
    question: "Commutative is to a + b = b + a as Associative is to ___?",
    options: ["a + 0 = a", "a * (b + c) = ab + ac", "a + (b + c) = (a + b) + c", "a * 1 = a"],
    answer: "a + (b + c) = (a + b) + c",
    explanation: "The associative property concerns how numbers are grouped in an operation, not their order."
  },
  {
    id: 'gcm-ana-04', level: 3, type: 'analogy',
    question: "y = mx + b is to a line as ___ is to a parabola?",
    options: ["y = x³", "a² + b² = c²", "y = ax² + bx + c", "sin(x)"],
    answer: "y = ax² + bx + c",
    explanation: "This is the standard form equation for a quadratic function, which graphs as a parabola."
  },
  {
    id: 'gcm-ana-05', level: 3, type: 'analogy',
    question: "Derivative is to Rate of Change as ___ is to Area Under a Curve?",
    options: ["Limit", "Integral", "Function", "Slope"],
    answer: "Integral",
    explanation: "This analogy relates the two fundamental concepts of calculus: differentiation and integration."
  },
  {
    id: 'gcm-ana-06', level: 3, type: 'property',
    question: "What is true about the slopes of two perpendicular lines (that are not horizontal/vertical)?",
    options: ["They are equal", "They are reciprocals", "They are negative reciprocals", "Their sum is 1"],
    answer: "They are negative reciprocals",
    explanation: "For example, if one line has a slope of 2, a line perpendicular to it will have a slope of -1/2."
  },
  {
    id: 'gcm-ana-07', level: 3, type: 'property',
    question: "In logic, what is the 'contrapositive' of the statement 'If P, then Q'?",
    options: ["If Q, then P", "If not P, then not Q", "If not Q, then not P", "P and not Q"],
    answer: "If not Q, then not P",
    explanation: "The contrapositive is logically equivalent to the original statement, which is a key concept in proofs."
  },
  {
    id: 'gcm-ana-08', level: 3, type: 'property',
    question: "What defines an 'asymptote' of a function's graph?",
    options: ["A point where the graph crosses the y-axis", "A value that is not in the function's domain", "A line that the graph approaches but never touches", "The highest or lowest point of the graph"],
    answer: "A line that the graph approaches but never touches",
    explanation: "Asymptotes describe the long-term behavior of a function as its input approaches a certain value or infinity."
  },
  {
    id: 'gcm-ana-09', level: 3, type: 'analogy',
    question: "Matrix is to Table of Numbers as Determinant is to ___?",
    options: ["Another matrix", "A single value", "A vector", "The inverse"],
    answer: "A single value",
    explanation: "The determinant is a special scalar value that can be calculated from a square matrix and describes its properties."
  },
  {
    id: 'gcm-ana-10', level: 3, type: 'analogy',
    question: "Fibonacci is to Sequence as Euclid is to ___?",
    options: ["Algorithm", "Number", "Set", "Calculus"],
    answer: "Algorithm",
    explanation: "Euclid's Algorithm is a famous, ancient procedure for finding the greatest common divisor of two integers."
  }
];
