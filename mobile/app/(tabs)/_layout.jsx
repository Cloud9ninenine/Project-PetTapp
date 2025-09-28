import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: '#1C86FF',
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require('@assets/images/service_icon/home icon.png')}
              style={{
                width: 30,
                height: 30,
                tintColor: color,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require('@assets/images/service_icon/message icon.png')}
              style={{
                width: 30,
                height: 30,
                tintColor: color,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-pets"
        options={{
          title: 'My Pets',
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require('@assets/images/service_icon/Pet Icon.png')}
              style={{
                width: 30,
                height: 30,
                tintColor: color,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require('@assets/images/service_icon/calendar icon.png')}
              style={{
                width: 30,
                height: 30,
                tintColor: color,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Image
              source={require('@assets/images/service_icon/user icon.png')}
              style={{
                width: 30,
                height: 30,
                tintColor: color,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}