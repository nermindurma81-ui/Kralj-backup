# 🚀 GitHub Push Uputstvo

## ⚠️ ZAŠTO NE RADI AUTOMATSKI?

GitHub **ne dozvoljava** password autentifikaciju od 2021. godine.
Treba **Personal Access Token (PAT)**.

---

## ✅ RJEŠENJE - 3 KORAKA (2 minuta!)

### **Korak 1: Kreiraj GitHub Token**

1. Otvori: **https://github.com/settings/tokens**
2. Klikni: **"Generate new token"** → **"Generate new token (classic)"**
3. **Token name:** `Kralj-Backup`
4. **Expiration:** `No expiration` (ili 90 dana)
5. **Select scopes:** ✅ **`repo`** (Full control of private repositories)
6. Klikni: **"Generate token"** (skrolaj do dna)
7. **Kopiraj token** (počinje sa `ghp_...`)

⚠️ **SAČUVAJ TOKEN!** (nećeš ga vidjeti opet)

---

### **Korak 2: Push-uj na GitHub**

Otvori **Terminal** i pokreni:

```bash
cd /mnt/data/openclaw/workspace/.openclaw/workspace
```

Onda:

```bash
git remote set-url origin https://github.com/nermindurma81-ui/Kralj-backup.git
git push -u origin main --force
```

Kad traži **Username**:
```
nermindurma81-ui
```

Kad traži **Password**:
```
Zalijepi token (ghp_xxxxxxxxxxxx)
```

⚠️ **Nećeš vidjeti znakove dok kucaš password** - to je normalno! Samo zalijepi i pritisni Enter.

---

### **Korak 3: Provjeri na GitHub-u**

Otvori: **https://github.com/nermindurma81-ui/Kralj-backup**

Trebaš vidjeti:
- ✅ Svi fajlovi (MEMORY.md, IDENTITY.md, shortai-video-factory/, itd.)
- ✅ Commit history
- ✅ memory/ folder

---

## 📦 ŠTA ĆE BITI UPLOAD-OVANO:

| Folder/Fajl | Opis |
|-------------|------|
| `MEMORY.md` | Dugoročna memorija |
| `IDENTITY.md` | Kralj identitet |
| `TOOLS.md` | Environment notes |
| `SOUL.md` | Persona |
| `USER.md` | O Nerminu |
| `AGENTS.md` | Agent uputstva |
| `HEARTBEAT.md` | Heartbeat tasks |
| `memory/` | Dnevni logovi |
| `shortai-video-factory/` | ShortAI app (kompletan) |
| `ai-video-pipeline/` | AI Video Pipeline |
| `v0-app/` | v0-style app |
| `skills/` | Skill folderi |
| `+ ostalo` | Svi ostali fajlovi |

**Ukupno:** ~50MB (bez node_modules i dist)

---

## ❓ AKO ZAPNEŠ:

### Problem: "Permission denied"
**Rješenje:** Token nema `repo` scope. Kreiraj novi token sa `repo` scope.

### Problem: "Authentication failed"
**Rješenje:** Kopiraj cijeli token (bez razmaka). Token počinje sa `ghp_`.

### Problem: "remote origin already exists"
**Rješenje:** To je OK! Samo nastavi sa `git push`.

### Problem: "src refspec main does not match"
**Rješenje:** Pokreni: `git branch -M main` pa opet `git push`.

---

## 🎯 KAD ZAVRŠIŠ:

Javi mi da je push uspio! Ili ako zapneš negdje, reci pa ću pomoći! 👑

---

**SREĆNO! 🚀**
