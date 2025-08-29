import { theme } from "@/constants/theme";
import { hp, wp } from "@/helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const Header = ({ 
    title, 
    showBackButton = true, 
    onBackPress,
    rightComponent,
    style = {}
}) => {
    const router = useRouter();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <View style={[styles.header, style]}>
            <View style={styles.leftSection}>
                {showBackButton && (
                    <Pressable 
                        onPress={handleBackPress}
                        style={styles.backButton}
                    >
                        <Ionicons 
                            name="arrow-back" 
                            size={24} 
                            color={theme.colors.text.primary} 
                        />
                    </Pressable>
                )}
            </View>
            
            <View style={styles.centerSection}>
                <Text style={styles.title}>{title}</Text>
            </View>
            
            <View style={styles.rightSection}>
                {rightComponent || <View style={styles.placeholder} />}
            </View>
        </View>
    );
};

export default Header;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: 'white',
    },
    leftSection: {
        width: hp(5),
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backButton: {
        padding: hp(1),
        borderRadius: theme.radius.sm,
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: theme.fontSizes.xl,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    rightSection: {
        width: hp(5),
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    placeholder: {
        width: hp(4),
        height: hp(4),
    },
});
