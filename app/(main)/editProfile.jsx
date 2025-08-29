import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { hp, wp } from "@/helpers/common";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

const EditProfile = () => {
    const { user, setUserData } = useAuth();
    const router = useRouter();
    
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || '',
        bio: user?.bio || ''
    });



    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant permission to access your photo library');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadImageToCloudinary = async (imageUri) => {
        try {
            setUploadingImage(true);
            
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'profile-image.jpg',
            });
            formData.append('upload_preset', 'blogimages');
            formData.append('cloud_name', 'dt4dafjca');

            const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dt4dafjca/image/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.secure_url) {
                return uploadResult.secure_url;
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        } finally {
            setUploadingImage(false);
        }
    };

    const onSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert("Error", "Name is required");
            return;
        }

        if (!formData.email.trim()) {
            Alert.alert("Error", "Email is required");
            return;
        }

        setLoading(true);
        
        try {
            let imageUrl = user?.image;

            if (selectedImage) {
                try {
                    imageUrl = await uploadImageToCloudinary(selectedImage.uri);
                } catch (error) {
                    Alert.alert("Error", "Failed to upload image. Please try again.");
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase
                .from('users')
                .update({
                    name: formData.name.trim(),
                    phoneNumber: formData.phoneNumber.trim() || null,
                    address: formData.address.trim() || null,
                    bio: formData.bio.trim() || null,
                    image: imageUrl
                })
                .eq('id', user.id)
                .select()
                .single();

            if (error) {
                console.error('Update error:', error);
                Alert.alert("Error", "Failed to update profile");
                return;
            }

            setUserData({
                ...user,
                ...formData,
                image: imageUrl
            });

            Alert.alert("Success", "Profile updated successfully", [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert("Error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title="Edit Profile" />

            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.avatarSection}>
                        <Pressable style={styles.avatarContainer} onPress={pickImage}>
                            <Avatar 
                                uri={selectedImage?.uri || user?.image} 
                                size={hp(10)} 
                                rounded={hp(5)}
                            />
                            <View style={styles.editAvatarButton}>
                                {uploadingImage ? (
                                    <Ionicons name="cloud-upload" size={16} color="white" />
                                ) : (
                                    <Ionicons name="camera" size={16} color="white" />
                                )}
                            </View>
                        </Pressable>
                        <Text style={styles.avatarText}>
                            {uploadingImage ? 'Uploading...' : 'Tap to change photo'}
                        </Text>
                        {selectedImage && !uploadingImage && (
                            <Text style={styles.selectedImageText}>
                                New image selected - will be uploaded when you save
                            </Text>
                        )}
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.name}
                                onChangeText={(value) => updateField('name', value)}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Email *</Text>
                            <TextInput
                                style={[styles.textInput, styles.disabledInput]}
                                value={formData.email}
                                editable={false}
                                placeholder="Enter your email"
                                placeholderTextColor={theme.colors.text.tertiary}
                                keyboardType="email-address"
                            />
                            <Text style={styles.fieldNote}>Email cannot be changed</Text>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.phoneNumber}
                                onChangeText={(value) => updateField('phoneNumber', value)}
                                placeholder="Enter your phone number"
                                placeholderTextColor={theme.colors.text.tertiary}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Address</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.address}
                                onChangeText={(value) => updateField('address', value)}
                                placeholder="Enter your address"
                                placeholderTextColor={theme.colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Bio</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={formData.bio}
                                onChangeText={(value) => updateField('bio', value)}
                                placeholder="Tell us about yourself"
                                placeholderTextColor={theme.colors.text.tertiary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.buttonSection}>
                        <Pressable 
                            style={[
                                styles.saveButton, 
                                loading && styles.disabledButton
                            ]} 
                            onPress={onSave}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

export default EditProfile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: hp(4),
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: hp(3),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: hp(1),
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.accent,
        borderRadius: hp(2),
        width: hp(3.5),
        height: hp(3.5),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    avatarText: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.text.secondary,
        marginBottom: hp(0.5),
    },
    selectedImageText: {
        fontSize: theme.fontSizes.xs,
        color: theme.colors.accent,
        fontStyle: 'italic',
    },
    formSection: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    fieldContainer: {
        marginBottom: hp(3),
    },
    fieldLabel: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: hp(1),
    },
    textInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.surface,
    },
    disabledInput: {
        backgroundColor: theme.colors.background,
        color: theme.colors.text.secondary,
    },
    textArea: {
        height: hp(12),
        textAlignVertical: 'top',
    },
    fieldNote: {
        fontSize: theme.fontSizes.xs,
        color: theme.colors.text.tertiary,
        marginTop: hp(0.5),
        fontStyle: 'italic',
    },
    buttonSection: {
        paddingHorizontal: wp(4),
        paddingTop: hp(2),
    },
    saveButton: {
        backgroundColor: theme.colors.accent,
        borderRadius: theme.radius.lg,
        paddingVertical: hp(2),
        alignItems: 'center',
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: theme.fontSizes.base,
        fontWeight: '600',
        color: 'white',
    },
    cameraButton: {
        padding: hp(1),
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.background,
    },
});