"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const localVariables = figma.variables.getLocalVariables('COLOR'); // filters local variables by the 'COLOR' type
let localVariablesArray = localVariables.map(({ id, name }) => ({ id, name }));
let count = 0;
const selection = figma.currentPage.selection;
figma.skipInvisibleInstanceChildren = true;
const nodes = figma.currentPage.findAllWithCriteria({
    types: ['BOOLEAN_OPERATION',
        'COMPONENT',
        'COMPONENT_SET',
        'ELLIPSE',
        'FRAME',
        'INSTANCE',
        'LINE',
        'POLYGON',
        'RECTANGLE',
        'SHAPE_WITH_TEXT',
        'STAR',
        'TEXT',
        'VECTOR',
        'GROUP']
});
if (selection.length >= 1) {
    iterateSelectionAndReplace();
}
else {
    replaceColors(localVariablesArray, nodes);
}
if (count) {
    figma.notify(`Mission complete! 💥 ${count} ${count > 1 ? 'colors were' : 'color was'} not reassigned`);
}
else {
    figma.notify(`🙌 Mission complete!`);
}
;
figma.closePlugin();
function addNewNodeToSelection(page, node) {
    // .concat() creates a new array
    page.selection = page.selection.concat(node);
}
function iterateSelectionAndReplace() {
    return __awaiter(this, void 0, void 0, function* () {
        //now we iterate through every node in the selection
        const selectedNodes = figma.currentPage.selection;
        for (const i in selectedNodes) {
            // add parent node 
            replaceColors(localVariablesArray, [selectedNodes[i]]);
            // iterate and add child nodes
            if ("children" in selectedNodes[i]) {
                const childrenNodes = figma.currentPage.selection[i].findAllWithCriteria({
                    types: ['BOOLEAN_OPERATION',
                        'COMPONENT',
                        'COMPONENT_SET',
                        'ELLIPSE',
                        'FRAME',
                        'INSTANCE',
                        'LINE',
                        'POLYGON',
                        'RECTANGLE',
                        'SHAPE_WITH_TEXT',
                        'STAR',
                        'TEXT',
                        'VECTOR',
                        'GROUP']
                });
                for (const child of childrenNodes) {
                    replaceColors(localVariablesArray, [child]);
                }
            }
        }
    });
}
function replaceColors(localVariablesArray, nodes) {
    var _a;
    for (const node of nodes) {
        // check if node has fills, and if it is bounded to a variable
        if ("fills" in node && node.boundVariables['fills'] !== undefined && node.type !== 'TEXT') {
            const originalVariable = figma.variables.getVariableById(node.boundVariables['fills'][0].id);
            // check if a node's fill color has a pair in the file
            if (localVariablesArray.some(elem => elem.name === (originalVariable === null || originalVariable === void 0 ? void 0 : originalVariable.name)) && node.type !== 'TEXT') {
                const localVariableId = localVariablesArray.find(elem => elem.name === (originalVariable === null || originalVariable === void 0 ? void 0 : originalVariable.name)).id;
                const localVariable = figma.variables.getVariableById(localVariableId);
                if (localVariable) {
                    const fillsCopy = [...node.fills];
                    fillsCopy[0] = figma.variables.setBoundVariableForPaint(fillsCopy[0], 'color', localVariable);
                    node.fills = fillsCopy;
                }
            }
            else {
                count++;
                addNewNodeToSelection(figma.currentPage, node);
            }
        }
        // check if node has strokes, and if it is bounded to a variable
        if ("strokes" in node && node.boundVariables['strokes'] !== undefined) {
            const originalVariable = figma.variables.getVariableById(node.boundVariables['strokes'][0].id);
            // check if a node's stroke color has a pair in the file
            if (localVariablesArray.some(elem => elem.name === (originalVariable === null || originalVariable === void 0 ? void 0 : originalVariable.name))) {
                const localVariableId = localVariablesArray.find(elem => elem.name === (originalVariable === null || originalVariable === void 0 ? void 0 : originalVariable.name)).id;
                const localVariable = figma.variables.getVariableById(localVariableId);
                if (localVariable) {
                    const strokesCopy = [...node.strokes];
                    strokesCopy[0] = figma.variables.setBoundVariableForPaint(strokesCopy[0], 'color', localVariable);
                    node.strokes = strokesCopy;
                }
            }
            else {
                count++;
                addNewNodeToSelection(figma.currentPage, node);
            }
        }
        // check if a node is a text, and it's fill color has a pair in the file
        if (node.type === 'TEXT') {
            const { textRangeFills, fills } = node.boundVariables;
            if (textRangeFills !== undefined || fills !== undefined) {
                const uniqueTextColors = node.getStyledTextSegments(['fills']);
                for (const fill of uniqueTextColors) {
                    if ((_a = fill.fills[0].boundVariables.color) === null || _a === void 0 ? void 0 : _a.id) {
                        const originalColor = figma.variables.getVariableById(fill.fills[0].boundVariables.color.id);
                        const localVariableTemp = localVariablesArray.find(elem => elem.name === (originalColor === null || originalColor === void 0 ? void 0 : originalColor.name));
                        const localVariable = localVariableTemp ? figma.variables.getVariableById(localVariableTemp.id) : null;
                        if (localVariable) {
                            node.setRangeFills(fill.start, fill.end, [figma.variables.setBoundVariableForPaint(fill.fills[0], 'color', localVariable)]);
                        }
                        else {
                            count++;
                            addNewNodeToSelection(figma.currentPage, node);
                        }
                    }
                }
            }
        }
    }
}
