import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CadetRegisterFormProps {
  visible: boolean;
  onClose: () => void;
  adminId: number;
}

export default function CadetRegisterForm({
  visible,
  onClose,
  adminId,
}: CadetRegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [rank, setRank] = useState('');
  const [squad, setSquad] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://192.168.43.201:5000/api/auth/register-cadet';

  const registerCadet = async () => {
    if (!fullName || !email || !phone || !enrollmentNumber) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          enrollmentNumber,
          rank,
          squad,
          batchYear: parseInt(batchYear) || null,
          dob,
          address,
          registeredByAdmin: adminId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Success', 'Cadet registered successfully');
        resetForm();
        onClose();
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (err) {
      Alert.alert('Error', 'Server not reachable');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setEnrollmentNumber('');
    setRank('');
    setSquad('');
    setBatchYear('');
    setDob('');
    setAddress('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Register New Cadet</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Full Name */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter cadet's full name"
            value={fullName}
            onChangeText={setFullName}
          />

          {/* Email */}
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          {/* Phone */}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Enrollment Number */}
          <Text style={styles.label}>Enrollment Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter enrollment number"
            value={enrollmentNumber}
            onChangeText={setEnrollmentNumber}
          />

          {/* Rank */}
          <Text style={styles.label}>Rank</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Cadet, Lance Naik, Naib Subedar"
            value={rank}
            onChangeText={setRank}
          />

          {/* Squad */}
          <Text style={styles.label}>Squad</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., A Squadron, B Squadron"
            value={squad}
            onChangeText={setSquad}
          />

          {/* Batch Year */}
          <Text style={styles.label}>Batch Year</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2024"
            value={batchYear}
            onChangeText={setBatchYear}
            keyboardType="number-pad"
          />

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={dob}
            onChangeText={setDob}
          />

          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={registerCadet}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Registering...' : 'Register Cadet'}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
