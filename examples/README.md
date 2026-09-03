# Examples · 真實資料成品案例

templates/ 裡的 gallery 是「例句」（示範資料、多卡合頁）；這裡是「成文」——拿一篇真實文章的公開資料，從判形狀到出圖走完整個 skill 流程的成品。拿不準交付物該長什麼樣，先看這裡。

## r04-financial-report.zh.html

這是 R04「月度營運」範本的一份財務場景範例：保留原有版心和四個圖表槽位，將內容改為月度經營財報，包括收入、毛利、經營現金流、毛利率、現金可支撐月數、每日收入、收款時段、收入構成和業務線毛利貢獻。資料為虛構示範資料，用來說明同一範本如何適用金融 / 經濟類報告。

預覽圖：[R04 月度經營財報](../docs/assets/examples/r04-financial-report.zh.png)

## lenny-2026-survey.html

資料來源：Lenny's Newsletter《How tech workers are feeling in 2026》（2026-07-07，年度科技從業者調查）。一篇文章 → 8 張圖，全英文，8 個範本不重複：

這是圖數規則確定前保留的早期展示案例，用 8 張圖覆蓋更多範本。當前 skill 處理同類文章時，預設會篩選為 4–6 張，並在超過 6 張時拆頁。

| # | 範本 | 資料 |
|---|------|------|
| 1 | Type Colonnade (L12) | AI 身份認同 49/27/14/5/3 |
| 2 | Ballot Tally (L15) | 矛盾三聯：享受工作 79 · 顯著倦怠 56 · 樂觀 49 |
| 3 | Hundred Faces（語義單位·通欄） | 裁員擔憂 28/31/21/12/8，嘴角弧度=擔憂程度 |
| 4 | Tick Rows (F5) | 四大恐懼 51/46/41/22 |
| 5 | Hourglass Stream (L13) | 矛盾收窄 100 → 77 → 51 |
| 6 | Brand Spectrum (L7) | 分層 NPS −49/−23/−5 |
| 7 | Radial Convergence (L5) | 產業一句話：混亂 30/快 17/泡沫 12/興奮 11/其他 30 |
| 8 | Ballot Rings（錶盤 tick·通欄） | AI 生產力 82 → 49 |

這個檔案順便示範了幾條容易忘的規矩：

- **取整要認帳**：身份認同取整後只有 98，底注寫「rounding ate the other two」，不湊假線。
- **沒有的資料不編**：Brand Spectrum 範本原有競品對照點，Lenny 沒這個資料，刪空。
- **精確份額關掉隨機洩漏**：Radial Convergence 範本的 rnd 洩漏邏輯（約 8% 匯錯 hub 製造有機感）在調查資料上要關。
- **同一批多圖範本不重複**：8 張圖 8 個範本。
- **cascade 豎排類目名只配短標籤**——本例曾用 Dot Cascade 畫恐懼資料，兩輪都被評「看不清」，換成橫排 Tick Rows 後解決：標籤保持水平永遠是更穩的選擇。
- **reduced-motion 降級不能漏**（無頭截圖驗證時可用 `--force-prefers-reduced-motion` 繞過動畫時序）。
