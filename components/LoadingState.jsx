import { theme } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const LoadingState = ({ 
    size = 20, 
    color = theme.colors.text.inverse,
    style,
    variant = 'spinner'
}) => {
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (variant === 'spinner') {
            const spinAnimation = Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );
            spinAnimation.start();

            return () => spinAnimation.stop();
        } else if (variant === 'pulse') {
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseValue, {
                        toValue: 1.2,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseValue, {
                        toValue: 1,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();

            return () => pulseAnimation.stop();
        } else if (variant === 'dots') {
            const dotsAnimation = Animated.loop(
                Animated.stagger(200, [
                    Animated.sequence([
                        Animated.timing(dot1, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dot1, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(dot2, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dot2, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(dot3, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dot3, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            );
            dotsAnimation.start();

            return () => dotsAnimation.stop();
        }
    }, [variant]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (variant === 'spinner') {
        return (
            <View style={[styles.container, style]}>
                <Animated.View
                    style={[
                        styles.spinner,
                        {
                            width: size,
                            height: size,
                            borderColor: `${color}30`,
                            borderTopColor: color,
                            transform: [{ rotate: spin }],
                        },
                    ]}
                />
            </View>
        );
    }

    if (variant === 'pulse') {
        return (
            <View style={[styles.container, style]}>
                <Animated.View
                    style={[
                        styles.pulse,
                        {
                            width: size,
                            height: size,
                            backgroundColor: color,
                            transform: [{ scale: pulseValue }],
                        },
                    ]}
                />
            </View>
        );
    }

    if (variant === 'dots') {
        const dotSize = size * 0.3;
        return (
            <View style={[styles.container, styles.dotsContainer, style]}>
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            width: dotSize,
                            height: dotSize,
                            backgroundColor: color,
                            opacity: dot1,
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            width: dotSize,
                            height: dotSize,
                            backgroundColor: color,
                            opacity: dot2,
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            width: dotSize,
                            height: dotSize,
                            backgroundColor: color,
                            opacity: dot3,
                        },
                    ]}
                />
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    spinner: {
        borderWidth: 2,
        borderRadius: 50,
        borderStyle: 'solid',
    },

    pulse: {
        borderRadius: 50,
    },

    dotsContainer: {
        flexDirection: 'row',
        gap: 4,
    },

    dot: {
        borderRadius: 50,
    },
});

export default LoadingState;
