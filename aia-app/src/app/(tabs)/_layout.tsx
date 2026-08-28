import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandLogo, BrandMark } from '@/components/brand';
import { AppIcon, type IconName } from '@/lib/icons';
import { colors, fonts, radius, spacing } from '@/lib/theme';

function TabIcon({
  name,
  size,
  focused,
}: {
  name: IconName;
  size: number;
  focused: boolean;
}) {
  const color = focused ? colors.primary700 : colors.ink400;
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <AppIcon name={name} size={size} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: colors.primary700,
        tabBarInactiveTintColor: colors.ink400,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '108Vision',
          tabBarLabel: 'Home',
          headerTitle: () => <BrandLogo height={24} />,
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="house" size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="servizi"
        options={{
          title: 'Servizi',
          headerLeft: () => <BrandMark height={22} />,
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="briefcase" size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="pricing"
        options={{
          title: 'Prezzi',
          headerLeft: () => <BrandMark height={22} />,
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="euro" size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: 'Contatti',
          headerLeft: () => <BrandMark height={22} />,
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="mail" size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="prompt"
        options={{
          title: 'Assistente',
          headerLeft: () => <BrandMark height={22} />,
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="sparkles" size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.ink50,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    color: colors.ink950,
  },
  tabBar: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderTopColor: 'transparent',
    borderRadius: radius.xxl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    height: 68,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  tabIcon: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.primary50,
  },
});
