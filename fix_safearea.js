const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Replace standard SafeAreaView with the one from react-native-safe-area-context
            if (content.includes('SafeAreaView') && content.match(/import {[^}]*SafeAreaView[^}]*} from 'react-native';/)) {

                // Remove SafeAreaView from react-native imports
                content = content.replace(/(import {[^}]*)SafeAreaView,? ?([^}]*} from 'react-native';)/, (match, p1, p2) => {
                    let newImport = p1 + p2;
                    // Fix commas like `{ , View }` or trailing commas
                    newImport = newImport.replace(/\{\s+,/, '{').replace(/,\s+\}/, '}').replace(/,\s+,/, ',');
                    return newImport;
                });

                // Add import { SafeAreaView } from 'react-native-safe-area-context';
                if (!content.includes("from 'react-native-safe-area-context'")) {
                    content = content.replace(/import .* 'react-native';/, match => match + "\nimport { SafeAreaView } from 'react-native-safe-area-context';");
                } else {
                    if (!content.includes('SafeAreaView')) { // if safe-area-context import exists but not SafeAreaView
                        content = content.replace(/import {([^}]*)} from 'react-native-safe-area-context';/, (match, p1) => {
                            return `import {${p1}, SafeAreaView} from 'react-native-safe-area-context';`;
                        });
                    }
                }
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'app'));
