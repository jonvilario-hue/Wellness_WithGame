

export type ConceptCategory = {
    name: string;
    description: string;
    items: {
        word: string;
        definition: string;
        relatedTo?: string[]; // Words this item is semantically close to
    }[];
};

export const gcSpatialConceptData: ConceptCategory[] = [
    {
        name: "Cutting Tools",
        description: "Objects used for severing or incising.",
        items: [
            { word: "Saw", definition: "A tool with a toothed blade for cutting wood.", relatedTo: ["Axe", "Chisel"] },
            { word: "Scissors", definition: "An instrument with two pivoted blades for cutting paper or fabric.", relatedTo: ["Knife"] },
            { word: "Axe", definition: "A tool for chopping wood.", relatedTo: ["Saw"] },
            { word: "Knife", definition: "An instrument with a blade for cutting.", relatedTo: ["Scissors", "Chisel"] },
            { word: "Chisel", definition: "A long-bladed hand tool for shaping wood, stone, or metal.", relatedTo: ["Saw", "Knife"] },
        ]
    },
    {
        name: "Fastening Tools",
        description: "Objects used for joining things together.",
        items: [
            { word: "Hammer", definition: "A tool for driving nails.", relatedTo: ["Nail", "Screwdriver"] },
            { word: "Screwdriver", definition: "A tool for turning screws.", relatedTo: ["Hammer", "Wrench"] },
            { word: "Wrench", definition: "A tool for gripping and turning nuts and bolts.", relatedTo: ["Screwdriver"] },
            { word: "Nail", definition: "A small metal spike driven into wood to join things.", relatedTo: ["Hammer"] },
            { word: "Stapler", definition: "A device for fastening papers together with a staple.", relatedTo: [] },
        ]
    },
    {
        name: "Abstract Concepts",
        description: "Ideas or general notions.",
        items: [
            { word: "Justice", definition: "Just behavior or treatment.", relatedTo: ["Fairness", "Law"] },
            { word: "Freedom", definition: "The power to act, speak, or think as one wants.", relatedTo: ["Liberty"] },
            { word: "Fairness", definition: "Impartial and just treatment without favoritism.", relatedTo: ["Justice", "Equality"] },
            { word: "Equality", definition: "The state of being equal in status, rights, and opportunities.", relatedTo: ["Fairness"] },
            { word: "Liberty", definition: "The state of being free within society from oppressive restrictions.", relatedTo: ["Freedom"] },
            { word: "Law", definition: "The system of rules that a country or community recognizes.", relatedTo: ["Justice"] },
        ]
    },
    {
        name: "Emotions",
        description: "States of feeling.",
        items: [
            { word: "Joy", definition: "A feeling of great pleasure and happiness.", relatedTo: ["Contentment", "Excitement"] },
            { word: "Sadness", definition: "The condition or quality of being sad.", relatedTo: ["Grief"] },
            { word: "Anger", definition: "A strong feeling of annoyance, displeasure, or hostility.", relatedTo: ["Frustration"] },
            { word: "Frustration", definition: "The feeling of being upset or annoyed as a result of being unable to change or achieve something.", relatedTo: ["Anger"] },
            { word: "Contentment", definition: "A state of happiness and satisfaction.", relatedTo: ["Joy"] },
            { word: "Grief", definition: "Deep sorrow, especially that caused by someone's death.", relatedTo: ["Sadness"] },
            { word: "Excitement", definition: "A feeling of great enthusiasm and eagerness.", relatedTo: ["Joy"] },
        ]
    }
];
