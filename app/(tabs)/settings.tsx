import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { useSettingsStore } from '@/store/settingsStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notifStatus, setNotifStatus] = useState<string>('undetermined');
  const { showPastSchedules, setShowPastSchedules } = useSettingsStore();

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => setNotifStatus(status));
  }, []);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3"
        style={{ borderBottomColor: Colors.border, borderBottomWidth: 1, gap: 8 }}
      >
        <Ionicons name="settings" size={20} color={Colors.primary} />
        <Text className="text-white text-lg font-bold">설정</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 알림 */}
        <SectionHeader title="알림" />
        <SettingsRow
          icon="notifications-outline"
          title="알림 권한"
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: notifStatus === 'granted' ? Colors.primary : '#ef4444',
                }}
              >
                {notifStatus === 'granted' ? '허용됨' : '거부됨'}
              </Text>
              <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
                <Text style={{ color: Colors.text.muted, fontSize: 13 }}>설정 열기</Text>
              </Pressable>
            </View>
          }
        />

        {/* 디스플레이 */}
        <SectionHeader title="디스플레이" />
        <SettingsRow
          icon="time-outline"
          title="지난 상영 표시"
          subtitle="오늘 이미 시작된 상영도 목록에 보여줍니다"
          right={
            <Switch
              value={showPastSchedules}
              onValueChange={setShowPastSchedules}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#ffffff"
            />
          }
        />

        {/* 정보 */}
        <SectionHeader title="정보" />
        <SettingsRow
          icon="information-circle-outline"
          title="버전"
          right={
            <Text style={{ color: Colors.text.muted, fontSize: 14 }}>{appVersion}</Text>
          }
        />
        <Pressable
          onPress={() =>
            WebBrowser.openBrowserAsync('https://moviemania-olive.vercel.app')
          }
        >
          <SettingsRow
            icon="document-text-outline"
            title="개인정보처리방침"
            right={
              <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
            }
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: Colors.text.muted,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomColor: Colors.border,
        borderBottomWidth: 1,
        backgroundColor: Colors.surface,
      }}
    >
      <Ionicons
        name={icon as Parameters<typeof Ionicons>[0]['name']}
        size={20}
        color={Colors.text.secondary}
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 14 }}>{title}</Text>
        {subtitle && (
          <Text style={{ color: Colors.text.muted, fontSize: 12, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}
