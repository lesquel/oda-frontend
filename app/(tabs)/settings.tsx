import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { usersApi } from '@/features/users/services/users-api';
import { useThemeStore, displayFontLabels, fontScaleLabels } from '@/store/theme-store';
import type { DisplayFont, FontScale } from '@/store/theme-store';
import { useThemedColors } from '@/hooks/use-themed-colors';
import { Typography, Spacing } from '@/constants/colors';

type ThemeColors = ReturnType<typeof useThemedColors>;

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme, displayFont, setDisplayFont, fontScale, setFontScale } = useThemeStore();
  const C = useThemedColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  // ── Password change state ──
  const [showPassword, setShowPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ type: 'err', text: 'Completa todos los campos' });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ type: 'err', text: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'err', text: 'Las contraseñas no coinciden' });
      return;
    }
    try {
      setPwdSaving(true);
      await usersApi.changePassword(currentPwd, newPwd);
      setPwdMsg({ type: 'ok', text: '¡Contraseña actualizada!' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setShowPassword(false);
    } catch (err: any) {
      setPwdMsg({
        type: 'err',
        text: err.response?.data?.error ?? 'Error al cambiar la contraseña',
      });
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // ── Not authenticated ──
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text variant="display" style={styles.heading}>
            Ajustes
          </Text>
          <Text variant="body" style={styles.secondaryText}>
            Inicia sesión para acceder a la configuración
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/login')}>
            <Text variant="ui" style={styles.primaryBtnText}>
              Iniciar sesión
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text variant="display" style={styles.heading}>
            Ajustes
          </Text>
        </View>

        {/* ── Appearance ── */}
        <SectionTitle label="Apariencia" C={C} />

        <View style={styles.card}>
          <Pressable style={styles.row} onPress={toggleTheme}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={theme === 'dark' ? 'moon' : 'sunny'}
                size={20}
                color={C.wax}
              />
              <Text variant="ui" style={styles.rowLabel}>
                Tema
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text variant="ui" style={styles.rowValue}>
                {theme === 'dark' ? 'Oscuro' : 'Claro'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={C.pencil} />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.row}
            onPress={() => {
              const fonts: DisplayFont[] = ['cormorant', 'ebgaramond', 'montserrat'];
              const idx = fonts.indexOf(displayFont);
              setDisplayFont(fonts[(idx + 1) % fonts.length]);
            }}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="text" size={20} color={C.wax} />
              <Text variant="ui" style={styles.rowLabel}>
                Fuente principal
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text variant="ui" style={styles.rowValue}>
                {displayFontLabels[displayFont]}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={C.pencil} />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.row}
            onPress={() => {
              const scales: FontScale[] = ['small', 'normal', 'large'];
              const idx = scales.indexOf(fontScale);
              setFontScale(scales[(idx + 1) % scales.length]);
            }}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="resize" size={20} color={C.wax} />
              <Text variant="ui" style={styles.rowLabel}>
                Tamaño de texto
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text variant="ui" style={styles.rowValue}>
                {fontScaleLabels[fontScale]}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={C.pencil} />
            </View>
          </Pressable>
        </View>

        {/* ── Account ── */}
        <SectionTitle label="Cuenta" C={C} />

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color={C.wax} />
              <Text variant="ui" style={styles.rowLabel}>
                Usuario
              </Text>
            </View>
            <Text variant="ui" style={styles.rowValue}>
              @{user?.username}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color={C.wax} />
              <Text variant="ui" style={styles.rowLabel}>
                Email
              </Text>
            </View>
            <Text variant="ui" style={styles.rowValue}>
              {user?.email}
            </Text>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={styles.row}
            onPress={() => setShowPassword(!showPassword)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={C.wax} />
              <Text variant="ui" style={styles.rowLabel}>
                Cambiar contraseña
              </Text>
            </View>
            <Ionicons
              name={showPassword ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={C.pencil}
            />
          </Pressable>

          {showPassword && (
            <View style={styles.passwordSection}>
              {pwdMsg && (
                <View
                  style={[
                    styles.pwdMsg,
                    {
                      borderColor:
                        pwdMsg.type === 'ok' ? '#4CAF50' : C.wax,
                      backgroundColor:
                        pwdMsg.type === 'ok' ? '#4CAF5015' : `${C.wax}12`,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      pwdMsg.type === 'ok'
                        ? 'checkmark-circle-outline'
                        : 'alert-circle-outline'
                    }
                    size={14}
                    color={pwdMsg.type === 'ok' ? '#4CAF50' : C.wax}
                  />
                  <Text
                    variant="ui"
                    style={{
                      fontSize: 12,
                      color: pwdMsg.type === 'ok' ? '#4CAF50' : C.wax,
                      flex: 1,
                    }}
                  >
                    {pwdMsg.text}
                  </Text>
                </View>
              )}

              <TextInput
                style={styles.pwdInput}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                placeholder="Contraseña actual"
                placeholderTextColor={C.pencil}
                secureTextEntry
              />
              <TextInput
                style={styles.pwdInput}
                value={newPwd}
                onChangeText={setNewPwd}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                placeholderTextColor={C.pencil}
                secureTextEntry
              />
              <TextInput
                style={styles.pwdInput}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor={C.pencil}
                secureTextEntry
              />
              <Pressable
                style={[styles.primaryBtn, pwdSaving && { opacity: 0.5 }]}
                onPress={handleChangePassword}
                disabled={pwdSaving}
              >
                {pwdSaving ? (
                  <ActivityIndicator color={C.paper} size="small" />
                ) : (
                  <Text variant="ui" style={styles.primaryBtnText}>
                    Actualizar contraseña
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* ── About ── */}
        <SectionTitle label="Acerca de" C={C} />

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="information-circle-outline" size={20} color={C.wax} />
              <Text variant="ui" style={styles.rowLabel}>
                Versión
              </Text>
            </View>
            <Text variant="ui" style={styles.rowValue}>
              {APP_VERSION}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="code-slash-outline" size={20} color={C.wax} />
              <Text variant="ui" style={styles.rowLabel}>
                Plataforma
              </Text>
            </View>
            <Text variant="ui" style={styles.rowValue}>
              {Platform.OS === 'web'
                ? 'Web'
                : Platform.OS === 'ios'
                ? 'iOS'
                : 'Android'}
            </Text>
          </View>
        </View>

        {/* ── Danger zone ── */}
        <View style={{ marginTop: Spacing.xl }}>
          <Pressable
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={C.wax} />
            <Text variant="ui" style={styles.logoutText}>
              Cerrar sesión
            </Text>
          </Pressable>
        </View>

        <Text
          variant="ui"
          style={{
            textAlign: 'center',
            color: C.pencil,
            fontSize: 10,
            marginTop: Spacing.xl,
            letterSpacing: 1,
            opacity: 0.6,
          }}
        >
          ODA v{APP_VERSION} — Hecho con ♥
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ label, C }: { label: string; C: ThemeColors }) {
  return (
    <Text
      variant="ui"
      style={{
        fontSize: Typography.fontSize.xs,
        color: C.pencil,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
      }}
    >
      {label}
    </Text>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.paper,
    },
    scroll: {
      paddingBottom: Spacing['2xl'] * 2,
    },
    header: {
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border.light,
    },
    heading: {
      fontSize: Typography.fontSize['2xl'],
      color: C.ink,
      letterSpacing: 4,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
    },
    secondaryText: {
      color: C.pencil,
      fontSize: Typography.fontSize.base,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },

    // Card container
    card: {
      marginHorizontal: Spacing.md,
      backgroundColor: C.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border.light,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 4,
      minHeight: 48,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rowLabel: {
      fontSize: Typography.fontSize.base,
      color: C.ink,
    },
    rowValue: {
      fontSize: Typography.fontSize.sm,
      color: C.pencil,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border.light,
      marginLeft: Spacing.md + 30,
    },

    // Password section
    passwordSection: {
      padding: Spacing.md,
      paddingTop: Spacing.xs,
      gap: Spacing.sm,
    },
    pwdInput: {
      borderWidth: 1,
      borderColor: C.border.light,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.body,
      color: C.ink,
      backgroundColor: C.paper,
    },
    pwdMsg: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: Spacing.sm,
      borderRadius: 6,
      borderWidth: 1,
    },
    primaryBtn: {
      backgroundColor: C.wax,
      borderRadius: 20,
      paddingVertical: Spacing.sm + 2,
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    primaryBtnText: {
      color: C.paper,
      fontSize: Typography.fontSize.sm,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },

    // Logout
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.wax,
    },
    logoutText: {
      fontSize: Typography.fontSize.base,
      color: C.wax,
    },
  });
}
