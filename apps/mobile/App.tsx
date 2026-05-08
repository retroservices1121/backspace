import React, { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview'
import { Image, Platform, View, AppStateStatus, AppState} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Subscription } from 'expo-modules-core';

// const BASE_URL = 'http://192.168.50.80:3000'
// const BASE_URL = 'https://newsocial-prototype.web.app/'
const BASE_URL = 'http://backspace.to'

const registerForPushNotificationsAsync = async (webview : React.RefObject<WebView<{}>>) => {
  let token = null
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
    webview.current?.injectJavaScript('localStorage.setItem("pushToken", "'+token+'"); void(0);');
  } else {
    alert('Must use physical device for Push Notifications');
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    console.error('error configuring notifications')
  }


  return token
};

type Props = {};

const splashImage = require('./assets/splash.png')

const App: React.FC<Props> = ({}) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [lastActive, setLastActive] = useState(0);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const webview = useRef<WebView>(null);
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();
  

  function getToken() {
    if(webview.current) {
      registerForPushNotificationsAsync(webview)
      .then((token) => {
        if(token) setExpoPushToken(token)
      })
    } else {
      console.warn('webview not ready');
    }
  }
  const useAppState = () => {
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState<AppStateStatus>(appState.current);
  
    useEffect(() => {
      const onChange = (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("App has come to the foreground!");
        }
  
        appState.current = nextAppState;
        setAppStateVisible(appState.current);
        console.log("AppState", appState.current);
      };
      try {
        const subscription = AppState.addEventListener("change", onChange);  
      } catch (error) {
        console.error('error adding status listener')
      }
      
  
      return () => {
        AppState.removeEventListener("change", onChange);
      };
    }, []);
  
    return appStateVisible;
  }
  const appState : AppStateStatus = useAppState();

  function setPushListeners() {
    try {
      // This listener is fired whenever a notification is received while the app is foregrounded
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
        // alert(notification.request.content.body)
      });

      // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log(response);
      });

      return () => {
        notificationListener.current && Notifications.removeNotificationSubscription(notificationListener.current);
        responseListener.current && Notifications.removeNotificationSubscription(responseListener.current);
      };
    } catch (error) {
      console.error('error setting push listener')
    }
    
  }

  useEffect(getToken, [webview.current])
  useEffect(setPushListeners, []);
  useEffect(() => {
    const refreshMilliseconds = 2*60*1000 //2 minutes in milliseconds
    const now = Date.now();
    if(appState === 'active') {
      //Debounce the refresh so it doesn't happen for quick minimize and reopens
      if((lastActive + refreshMilliseconds) < now) {
        console.log('reloading app after idle')
        if(webview.current) {
          webview.current.reload();
          
        }
      }
      setLastActive(now);
    } else if (appState === 'background' || appState === 'inactive') {
      setLastActive(now);
    }
  }, [appState])

  return (
    <View style={{ flex: 1, backgroundColor: '#5822FB' }}>
      {/* userAgent is to fix Google SSO https://github.com/react-native-webview/react-native-webview/issues/162#issuecomment-1027613950 */}
      {/* @ts-ignore-next-line */}
      <WebView
        userAgent={Platform.OS === 'android' ? 'Chrome/18.0.1025.133 Mobile Safari/535.19' : 'AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75'}
        ref={webview}
        onLoadStart={() => setWebViewLoading(true)}
        onLoadProgress={() => {if(!webViewLoading) setWebViewLoading(true)}}
        onLoadEnd={() => setWebViewLoading(false)}
        source={{ uri: BASE_URL }}
        style={{ zIndex: 100, flex: 1, backgroundColor: 'transparent', position: 'relative'}}
      />
      {/* Below image is to hide the white loading indicator on default webview */}
      <Image style={{ width: '100%', height: '100%', zIndex: 20, display: webViewLoading ? 'flex' : 'none'}} source={splashImage} />
    </View>
  );
};

export default App;
