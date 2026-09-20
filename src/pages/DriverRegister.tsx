import React, { useState } from 'react';
import { Bike, Shield, CheckCircle2, AlertCircle, ArrowLeft, Camera } from 'lucide-react';
import { DB } from '../services/storageService';
import { hashPassword } from '../services/authService';

interface DriverRegisterProps {
  onBackToLogin: () => void;
  onRegisteredSuccess: () => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

export const DriverRegister: React.FC<DriverRegisterProps> = ({
  onBackToLogin,
  onRegisteredSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [vehicleType, setVehicleType] = useState<'Motor Matic' | 'Motor Bebek' | 'Motor Sport'>('Motor Matic');
  const [vehicleModel, setVehicleModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATARS[0]);
  const [addressArea, setAddressArea] = useState('');
  const [bio, setBio] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      !fullName.trim() ||
      !whatsapp.trim() ||
      !username.trim() ||
      !password.trim() ||
      !vehicleModel.trim() ||
      !plateNumber.trim() ||
      !addressArea.trim()
    ) {
      setErrorMsg('Harap lengkapi semua kolom pendaftaran yang wajib diisi.');
      return;
    }

    // Cek duplikasi username
    const existingDrivers = DB.getDrivers();
    if (
      existingDrivers.some(
        (d) => d.username.toLowerCase() === username.trim().toLowerCase()
      )
    ) {
      setErrorMsg('Username tersebut sudah terdaftar. Silakan pilih username lain.');
      return;
    }

    setIsSubmitting(true);
    const passwordHash = await hashPassword(password);

    DB.registerDriver({
      fullName: fullName.trim(),
      whatsapp: whatsapp.trim(),
      username: username.trim().toLowerCase(),
      passwordHash,
      gender,
      vehicleType,
      vehicleModel: vehicleModel.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      avatarUrl,
      addressArea: addressArea.trim(),
      bio: bio.trim() || 'Mitra siap melayani dengan ramah dan tepat waktu.',
    });

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onBackToLogin}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Login</span>
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Pendaftaran Berhasil Dikirim!
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Status akun Anda: <strong>MENUNGGU VERIFIKASI</strong>. Admin Ojek Olumajang akan
                memeriksa dan menyetujui akun Anda.
              </p>
            </div>
            <div className="pt-2">
              <button
                id="btn-finish-registration"
                onClick={onRegisteredSuccess}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-1 mb-4">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Daftar Mitra Driver Olumajang
              </h2>
              <p className="text-xs text-gray-500">
                Proses cepat &amp; transparan tanpa ribet berkas identitas.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Foto Profil Preset Picker */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Pilih Foto Profil
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt="Foto Profil"
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500 shadow-sm"
                  />
                  <div className="flex gap-1.5 overflow-x-auto py-1">
                    {DEFAULT_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ${
                          avatarUrl === url ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-gray-200 opacity-60'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Diri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nama Lengkap</label>
                  <input
                    id="input-reg-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Rian Pratama"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nomor WhatsApp</label>
                  <input
                    id="input-reg-wa"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0857xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Akun Login */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Username</label>
                  <input
                    id="input-reg-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="rian_motor"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Password</label>
                  <input
                    id="input-reg-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Gender & Jenis Kendaraan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Jenis Kelamin</label>
                  <select
                    id="select-reg-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Laki-laki' | 'Perempuan')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Jenis Kendaraan</label>
                  <select
                    id="select-reg-vehicle-type"
                    value={vehicleType}
                    onChange={(e) =>
                      setVehicleType(e.target.value as 'Motor Matic' | 'Motor Bebek' | 'Motor Sport')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Motor Matic">Motor Matic</option>
                    <option value="Motor Bebek">Motor Bebek</option>
                    <option value="Motor Sport">Motor Sport</option>
                  </select>
                </div>
              </div>

              {/* Merk Kendaraan & Plat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Merk / Tipe Motor</label>
                  <input
                    id="input-reg-vehicle-model"
                    type="text"
                    required
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Honda Vario 125 / Beat"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nomor Polisi (Plat N)</label>
                  <input
                    id="input-reg-plate"
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="N 1234 YZ"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
              </div>

              {/* Alamat Wilayah Lumajang */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Alamat / Wilayah Domisili di Lumajang
                </label>
                <input
                  id="input-reg-address"
                  type="text"
                  required
                  value={addressArea}
                  onChange={(e) => setAddressArea(e.target.value)}
                  placeholder="Contoh: Sukodono, Lumajang Kota, Pasirian, Klakah, dll."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Bio Singkat */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Bio Pengemudi</label>
                <input
                  id="input-reg-bio"
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Contoh: Berpengalaman rute Lumajang Kota & siap antar jemput amanah."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  id="btn-submit-registration"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition"
                >
                  {isSubmitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran Mitra Driver'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
