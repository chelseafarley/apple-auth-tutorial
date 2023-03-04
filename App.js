import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import jwtDecode from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

// npx expo install expo-apple-authentication
// npx expo install jwt-decode
// npx expo install expo-secure-store

export default function App() {
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [userToken, setUserToken] = useState();
  console.log("hi");

  useEffect(() => {
    const checkAvailable = async () => {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      setAppleAuthAvailable(isAvailable);

      if (isAvailable) {
        const credentialJson = await SecureStore.getItemAsync('apple-credentials');
        setUserToken(JSON.parse(credentialJson));
      }
    }
    checkAvailable();
  }, []);

  const login = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      });
      console.log(credential);
      setUserToken(credential);
      SecureStore.setItemAsync('apple-credentials', JSON.stringify(credential));
    } catch (e) {
      console.log(e);
    }
  }

  const getCredentialState = async () => {
    const credentialState = await AppleAuthentication.getCredentialStateAsync(userToken.user);
    console.log(credentialState);
  };

  const logout = async () => {
    SecureStore.deleteItemAsync('apple-credentials');
    setUserToken(undefined);
  };

  const refresh = async () => {
    const result = await AppleAuthentication.refreshAsync({
      user: userToken.user
    });
    console.log(result);
    setUserToken(result);
    SecureStore.setItemAsync('apple-credentials', JSON.stringify(result));
  };

  const getAppleAuthContent = () => {
    if (!userToken) {
      return <AppleAuthentication.AppleAuthenticationButton 
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={styles.button}
        onPress={login}
      />
    } else {
      const decoded = jwtDecode(userToken.identityToken);
      console.log(decoded);
      const current = Date.now() / 1000;
      return (
        <View>
          <Text>{decoded.email}</Text>
          <Text>Expired: {(current >= decoded.exp).toString()}</Text>
          <Button title="Logout" onPress={logout} />
          <Button title="Refresh" onPress={refresh} />
          <Button title="Get Credential State" onPress={getCredentialState} />
        </View>
      )
    }
  };
  return (
    <View style={styles.container}>
      {
        appleAuthAvailable
          ? getAppleAuthContent()
          : <Text>Apple auth unavailable</Text>
      }
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 200,
    height: 64
  }
});
