const fs = require('fs');

const homePath = 'src/screens/HomeScreen.tsx';
let homeContent = fs.readFileSync(homePath, 'utf8');

// Ensure Image is imported from react-native
if (!homeContent.includes('Image,')) {
  homeContent = homeContent.replace(
    /import \{\n\s*View,\n\s*Text,/,
    `import {\n  Image,\n  View,\n  Text,`
  );
}

// Add the logo right inside the SafeAreaView, before the statusBar
const logoReplacement = `
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* App Logo */}
      <View style={[styles.logoContainer, { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.homeLogo}
          resizeMode="contain"
        />
      </View>

      {/* Online/Offline Toggle */}
      <View style={[styles.statusBar, { backgroundColor: colors.card, borderBottomColor: colors.border, borderTopWidth: 0 }]}>
`;

homeContent = homeContent.replace(
  /<SafeAreaView edges=\{\['top'\]\} style=\{\[styles\.container, \{ backgroundColor: colors\.background \}\]\}>\n\s*\{?\/\* Online\/Offline Toggle \*\/\}\n\s*<View style=\{\[styles\.statusBar, \{ backgroundColor: colors\.card, borderBottomColor: colors\.border \}\]\}>/,
  logoReplacement
);

// Add styles
homeContent = homeContent.replace(
  /const styles = StyleSheet\.create\(\{/,
  `const styles = StyleSheet.create({
  logoContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeLogo: {
    width: 140,
    height: 40,
  },`
);

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('HomeScreen.tsx updated with logo');
