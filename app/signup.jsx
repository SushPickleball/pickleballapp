import Button from '@/components/Button';
import ScreenWrapper from '@/components/ScreenWrapper';
import { theme } from '@/constants/theme';
import { hp, wp } from '@/helpers/common';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';


import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const SignUp = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Information', 'Please enter your name to continue.');
            return;
        }

        if (!email.trim()) {
            Alert.alert('Missing Information', 'Please enter your email address to continue.');
            return;
        }

        if (!password.trim()) {
            Alert.alert('Missing Information', 'Please enter a password to continue.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }

        

        setIsLoading(true);

        const { data: {session}, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            }
            

        });
        setIsLoading(false);
      


        

        if (error) {
            Alert.alert('Error', error.message);
            return;
        }
        toast.show('Account created successfully', {
            type: 'success',
            placement: 'top',
            duration: 3000,
        });
        




    };

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <StatusBar style="dark" />
            
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <View style={styles.backIcon}>
                        <Text style={styles.backArrow}>←</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.heroSection}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.welcomeText}>Create account</Text>
                            <Text style={styles.title}>Join the adventure</Text>
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Full name</Text>
                                <TextInput
                                    style={[styles.input, name && styles.inputFilled]}
                                    placeholder="John Doe"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    autoComplete="name"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Email address</Text>
                                <TextInput
                                    style={[styles.input, email && styles.inputFilled]}
                                    placeholder="you@example.com"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="email"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={[styles.input, password && styles.inputFilled]}
                                    placeholder="Create a strong password"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="new-password"
                                />
                            </View>
                        </View>

                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                By creating an account, you agree to our{' '}
                                <Text style={styles.termsLink}>Terms of Service</Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>
                            </Text>
                        </View>

                        <Button
                            title="Create account"
                            onPress={handleSignUp}
                            loading={isLoading}
                            style={styles.signUpButton}
                        />

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Already have an account?</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity 
                            style={styles.signInButton}
                            onPress={() => router.push('/login')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.signInText}>Sign in instead</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    header: {
        paddingHorizontal: wp(6),
        paddingTop: hp(2),
        paddingBottom: hp(1),
        zIndex: 10,
    },

    backButton: {
        alignSelf: 'flex-start',
    },

    backIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.text.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },

    backArrow: {
        fontSize: 24,
        color: theme.colors.text.primary,
        fontWeight: '600',
        marginLeft: -2,
    },

    scrollContent: {
        flexGrow: 1,
        paddingBottom: hp(4),
    },

    heroSection: {
        paddingHorizontal: wp(6),
        paddingTop: hp(4),
        paddingBottom: hp(4),
    },

    titleContainer: {
        gap: 12,
    },

    welcomeText: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '500',
        color: theme.colors.text.tertiary,
        fontFamily: 'System',
    },

    title: {
        fontSize: theme.fontSizes['4xl'],
        fontWeight: '800',
        color: theme.colors.text.primary,
        fontFamily: 'System',
        letterSpacing: -0.5,
        lineHeight: theme.fontSizes['4xl'] * 1.2,
    },

    formSection: {
        paddingHorizontal: wp(6),
        gap: 24,
    },

    inputGroup: {
        gap: 20,
    },

    inputWrapper: {
        gap: 8,
    },

    label: {
        fontSize: theme.fontSizes.sm,
        fontWeight: '600',
        color: theme.colors.text.primary,
        fontFamily: 'System',
        marginLeft: 4,
    },

    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: theme.fontSizes.lg,
        color: theme.colors.text.primary,
        fontFamily: 'System',
        shadowColor: theme.colors.text.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },

    inputFilled: {
        borderColor: theme.colors.accent,
        backgroundColor: theme.colors.surface,
    },

    termsContainer: {
        paddingHorizontal: 4,
    },

    termsText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.tertiary,
        lineHeight: theme.fontSizes.sm * 1.4,
        textAlign: 'center',
        fontFamily: 'System',
    },

    termsLink: {
        color: theme.colors.accent,
        fontWeight: '600',
    },

    signUpButton: {
        marginTop: 8,
        borderRadius: 16,
        shadowColor: theme.colors.accent,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },

    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 16,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
    },

    dividerText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
        fontFamily: 'System',
    },

    signInButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginTop: 4,
    },

    signInText: {
        fontSize: theme.fontSizes.lg,
        color: theme.colors.text.primary,
        fontWeight: '600',
        fontFamily: 'System',
    },
});

export default SignUp;
