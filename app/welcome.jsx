import Button from '@/components/Button'
import ScreenWrapper from '@/components/ScreenWrapper'
import { theme } from '@/constants/theme'
import { hp, wp } from '@/helpers/common'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

const welcome = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/signup');
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.topSpacer} />
        
        <View style={styles.imageContainer}>
          <Image 
            style={styles.welcomeImage} 
            resizeMode='contain' 
            source={require('@/assets/images/welcome.png')} 
          />
        </View>

        <View style={styles.contentSection}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Pickleup!</Text>
            <Text style={styles.subtitle}>
              The best way to find your next adventure
            </Text>
          </View>

          <View style={styles.actionContainer}>
            <Button 
              title="Get Started"
              onPress={handleGetStarted}
              variant="primary"
              size="large"
            />
            
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text 
                  style={styles.loginText}
                  onPress={() => router.push('/login')}
                >
                  Login
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default welcome

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    topSpacer: {
        height: hp(8),
    },

    imageContainer: {
        flex: 0.4,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(10),
    },

    welcomeImage: {
        width: wp(75),
        height: hp(35),
        maxWidth: 300,
        maxHeight: 300,
    },

    contentSection: {
        flex: 0.6,
        justifyContent: 'space-between',
        paddingHorizontal: wp(8),
        paddingBottom: hp(8),
    },

    textContainer: {
        alignItems: 'center',
        gap: 16,
        paddingTop: hp(4),
    },

    title: {
        fontSize: theme.fontSizes['5xl'],
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
        letterSpacing: -1,
        lineHeight: theme.fontSizes['5xl'] * 1.1,
        fontFamily: 'System',
    },

    subtitle: {
        fontSize: theme.fontSizes.lg,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: theme.fontSizes.lg * 1.5,
        paddingHorizontal: wp(4),
        fontWeight: '400',
        fontFamily: 'System',
    },

    actionContainer: {
        gap: 24,
        alignItems: 'center',
        paddingTop: hp(3),
    },



    footerContainer: {
        alignItems: 'center',
    },

    footerText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        fontWeight: '400',
        fontFamily: 'System',
    },

    loginText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.accent,
        fontWeight: '600',
        fontFamily: 'System',
    },
})