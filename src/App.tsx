import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  const [activeRiderId, setActiveRiderId] = useState<string | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState("LOCATING YOUR ZONE...");
  const [errorMsg, setErrorMsg] = useState("");
  const [now, setNow] = useState(new Date());
  
  const [isDemoMode, setIsDemoMode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scratchCount, setScratchCount] = useState(0);
  const [canvasHidden, setCanvasHidden] = useState(false);
  const [hasStartedScratching, setHasStartedScratching] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const trackOpen = useMutation(api.cards.trackOpen);
  const revealCard = useMutation(api.cards.revealCard);

  useEffect(() => {
    if (isScratched) {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isScratched]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("id");
    
    if (idFromUrl) {
      setActiveRiderId(idFromUrl);
      trackOpen({ accessKey: idFromUrl }).catch(() => {});
      setStatusMessage("SWIPE TO REVEAL TARGET");
    } else {
      setIsDemoMode(true);
      setActiveRiderId("DEMO_MODE");
      setStatusMessage("SWIPE TO REVEAL TARGET");
    }
  }, [trackOpen]);

  useEffect(() => {
    const paintFoil = () => {
      const canvas = canvasRef.current;
      if (!canvas || canvasHidden) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, "#e6c25a");
      bgGradient.addColorStop(0.4, "#fdf0bd");
      bgGradient.addColorStop(0.6, "#d4af37");
      bgGradient.addColorStop(1, "#b8860b");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
      for(let i = 0; i < canvas.width; i += 3) {
        for(let j = 0; j < canvas.height; j += 3) {
          if(Math.random() > 0.5) ctx.fillRect(i, j, 2, 2);
        }
      }
      
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      for (let i = -canvas.width; i < canvas.width * 2; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + canvas.height, canvas.height);
        ctx.stroke();
      }

      ctx.lineWidth = 6;
      ctx.strokeStyle = "#8a6508"; 
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(138, 101, 8, 0.5)"; 
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
      ctx.setLineDash([]);

      const maxTextWidth = canvas.width - 40; 
      
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      ctx.font = "bold 16px 'Rajdhani', sans-serif";
      ctx.fillStyle = "#8a6508";
      ctx.fillText("FLIPKART MINUTES", canvas.width / 2, 40, maxTextWidth);

      ctx.shadowColor = "rgba(255, 255, 255, 0.7)"; 
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.font = "bold 46px 'Teko', sans-serif"; 
      ctx.fillStyle = "#3a0202"; 
      ctx.fillText("SCRATCH & WIN", canvas.width / 2, canvas.height / 2 + 5, maxTextWidth);
      
      ctx.shadowColor = "transparent";

      ctx.font = "bold 16px 'Rajdhani', sans-serif";
      ctx.fillStyle = "#5a0a18";
      ctx.fillText("REVEAL YOUR EXCLUSIVE PAYOUT", canvas.width / 2, canvas.height - 40, maxTextWidth);
    };

    paintFoil();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        paintFoil();
      });
    }
  }, [activeRiderId, canvasHidden, isScratched]); 

  const handleScratchStart = (e: any) => {
    setIsDrawing(true);
    
    if (!hasStartedScratching) {
      setHasStartedScratching(true);
      setStatusMessage("AUTHENTICATING ID...");
      
      if (isDemoMode) {
        setTimeout(() => {
          setRewardData({
            riderName: "Rahul Sharma",
            riderId: "BLR_KOR_RIDER_001",
            storeName: "Koramangala Hub",
            city: "Bengaluru",
            theme: "maroon_gold",
            title: "KORAMANGALA MEGA SURGE",
            eventDates: "Oct 7 & 8",
            shift: "PEAK SHIFT BOOST",
            earnings: "₹1,500",
            perOrderBonus: "₹50",
            continuationBonus: "₹2,000",
          });
        }, 300);
      } else {
        revealCard({ accessKey: activeRiderId!, userAgent: navigator.userAgent })
          .then(payload => setRewardData(payload))
          .catch(err => {
            if (err.message?.includes("CARD_NOT_FOUND")) {
              setErrorMsg("SECURITY ERROR: INVALID OR TAMPERED LINK.");
            } else if (err.message?.includes("ALREADY_SCRATCHED")) {
              setErrorMsg("THIS TICKET HAS ALREADY BEEN REDEEMED.");
            } else if (err.message?.includes("CARD_EXPIRED")) {
              setErrorMsg("THIS TICKET HAS EXPIRED.");
            } else {
              setErrorMsg("INVALID SECURE LINK.");
            }
          });
      }
    }
    handleScratchMove(e, true);
  };

  const handleScratchEnd = () => {
    setIsDrawing(false);
  };

  const handleScratchMove = (e: any, forceDraw = false) => {
    if ((!isDrawing && !forceDraw) || canvasHidden) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();

    setScratchCount(prev => prev + 1);
  };

  useEffect(() => {
    if (scratchCount > 50 && !canvasHidden) {
      setCanvasHidden(true);
      setIsAnimating(true);
      
      setTimeout(() => {
        setIsScratched(true);
        setIsAnimating(false);
      }, 700);
    }
  }, [scratchCount, canvasHidden]);

  if (errorMsg && !isDemoMode) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#1a0000", color: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "sans-serif", textAlign: "center" }}>
        <h2>🚫 {errorMsg}</h2>
      </div>
    );
  }

  const FLogo = () => (
    <span style={{ background: "#f8e5a0", color: "#3a0202", fontWeight: "900", padding: "0px 5px", borderRadius: "3px", fontStyle: "italic", display: "inline-block", transform: "skewX(-10deg)", margin: "0 4px", fontSize: "0.9em" }}>
      F
    </span>
  );

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Teko:wght@500;700&family=Rajdhani:wght@500;700&display=swap');
          body { margin: 0; padding: 0; background-color: #240000; overflow-x: hidden; }
          
          .ticket-glow { animation: goldGlow 2s infinite alternate; }
          @keyframes goldGlow { 
            0% { box-shadow: 0 0 15px rgba(212, 175, 55, 0.3); transform: scale(1); } 
            100% { box-shadow: 0 0 35px rgba(212, 175, 55, 0.7); transform: scale(1.02); } 
          }
          
          .drive-away { animation: driveOff 0.7s forwards cubic-bezier(0.5, 0, 0.2, 1); }
          @keyframes driveOff { 
            0% { transform: translateX(0) scale(1); opacity: 1; } 
            20% { transform: translateX(20px) scale(1.1) rotate(5deg); } 
            100% { transform: translateX(-150vw) scale(1) rotate(-10deg); opacity: 0; } 
          }
          
          .wobble-alert { animation: wobble 1.5s infinite; }
          @keyframes wobble {
            0%, 100% { transform: rotate(0deg); }
            10%, 30%, 50%, 70%, 90% { transform: rotate(-2deg); }
            20%, 40%, 60%, 80% { transform: rotate(2deg); }
          }
          .road-line {
            position: absolute;
            left: 22px;
            top: 30px;
            bottom: 30px;
            width: 4px;
            background: repeating-linear-gradient(to bottom, #d4af37 0, #d4af37 10px, transparent 10px, transparent 20px);
            z-index: 0;
          }
        `}
      </style>

      <div style={{ 
        minHeight: "100vh", 
        width: "100vw",
        backgroundColor: "#240000", 
        backgroundImage: "radial-gradient(circle at top, #4a0808 0%, #110000 100%)",
        color: "#fff",
        fontFamily: "'Rajdhani', sans-serif", 
        display: "flex",
        flexDirection: "column"
      }}>
        
        <div style={{ padding: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", borderBottom: "1px solid rgba(212, 175, 55, 0.2)" }}>
          <FLogo />
          <h2 style={{ margin: 0, color: "#f8e5a0", fontSize: "1.3rem", fontStyle: "italic", letterSpacing: "1px" }}>
            Flipkart Minutes
          </h2>
        </div>
        
        {activeRiderId && !isScratched && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            
            {/* EXPANDED BOUNDING BOX: Exactly 350x250 */}
            <div style={{ width: "350px", height: "250px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              
              <div className={isAnimating ? "drive-away" : ""} style={{ fontSize: "5rem", marginBottom: "5px" }}>
                🛵💨
              </div>
              <div style={{ transition: "opacity 0.3s", opacity: isAnimating ? 0 : 1, width: "100%", padding: "0 10px", boxSizing: "border-box" }}>
                <h1 style={{ color: "#d4af37", fontSize: "2.4rem", fontFamily: "'Teko', sans-serif", textTransform: "uppercase", margin: 0, lineHeight: "1" }}>
                  YOUR TARGET
                </h1>
                <p style={{ color: "#f9f1d8", fontSize: "0.95rem", letterSpacing: "1px", marginTop: "10px", fontWeight: "bold" }}>
                  {statusMessage}
                </p>
              </div>

              {!canvasHidden && (
                <canvas
                  ref={canvasRef}
                  width={350}
                  height={250}
                  className="ticket-glow"
                  onMouseDown={handleScratchStart}
                  onMouseMove={(e) => handleScratchMove(e)}
                  onMouseUp={handleScratchEnd}
                  onMouseLeave={handleScratchEnd}
                  onTouchStart={handleScratchStart}
                  onTouchMove={(e) => handleScratchMove(e)}
                  onTouchEnd={handleScratchEnd}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    borderRadius: "15px",
                    cursor: "crosshair",
                    touchAction: "none" 
                  }}
                />
              )}
            </div>
          </div>
        )}

        {isScratched && rewardData && (
          <>
            <div style={{ background: "linear-gradient(90deg, #5a0a18, #3a0202)", borderBottom: "1px solid #d4af37", padding: "12px 10px", textAlign: "center", color: "#f8e5a0", fontWeight: "bold", fontSize: "1rem", letterSpacing: "1px", textTransform: "uppercase", boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
              ⏳ Hurry! Claim within 24 hrs at your nearest <FLogo /> Minutes store
            </div>
            
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "15px", maxWidth: "500px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
              
              <div style={{ backgroundColor: "#3a0202", border: "1px solid #d4af37", padding: "20px", borderRadius: "12px", marginBottom: "20px", textAlign: "center", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.15)" }}>
                <p style={{ margin: "0 0 10px 0", color: "#d4af37", fontWeight: "bold", fontSize: "0.95rem", letterSpacing: "2px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  🎫 EXCLUSIVE RIDER UNLOCK
                </p>
                <h2 style={{ margin: "0 0 5px 0", color: "#fff", fontSize: "2rem", fontFamily: "'Teko', sans-serif", letterSpacing: "1px" }}>
                  {rewardData.riderName}
                </h2>
                <div style={{ display: "inline-block", background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.3)", color: "#f8e5a0", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", letterSpacing: "1px", marginBottom: "15px" }}>
                  OFFICIAL ID: {rewardData.riderId}
                </div>
                <p style={{ margin: 0, color: "#f9f1d8", fontSize: "1.05rem", lineHeight: "1.4" }}>
                  Hey {rewardData.riderName.split(" ")[0]}, we've reserved this special payout structure just for you. Drop by the <strong>{rewardData.storeName}</strong> in <strong>{rewardData.city}</strong> to lock in these max earnings before they're gone!
                </p>
              </div>

              <div className="wobble-alert" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "rgba(212, 175, 55, 0.1)", border: "1px solid #d4af37", padding: "6px 15px", borderRadius: "50px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)" }}>
                <div style={{ width: "10px", height: "10px", backgroundColor: "#f8e5a0", borderRadius: "50%", boxShadow: "0 0 8px #f8e5a0", animation: "pulseAnim 1s infinite" }}></div>
                <span style={{ color: "#f8e5a0", fontSize: "1rem", letterSpacing: "1px", fontWeight: "bold" }}>
                  LIVE TICKET: {now.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>

              <div style={{ textAlign: "center", marginBottom: "20px", position: "relative" }}>
                <div style={{ display: "inline-block", background: "linear-gradient(90deg, #d4af37, #b58b00)", color: "#3a0202", padding: "4px 20px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                  ⚡ {rewardData.shift}
                </div>
                <h2 style={{ color: "#fff", margin: 0, fontSize: "2.5rem", fontFamily: "'Teko', sans-serif", letterSpacing: "1px", textShadow: "0px 2px 10px rgba(0,0,0,0.8)" }}>
                  {rewardData.title}
                </h2>
              </div>

              <div style={{ background: "linear-gradient(135deg, #d4af37, #f8e5a0)", padding: "18px", borderRadius: "12px", color: "#3a0202", marginBottom: "25px", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)", position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "900", fontSize: "1.4rem", letterSpacing: "0.5px", fontFamily: "'Teko', sans-serif" }}>
                    🔥 BBD 2026 IS HERE!
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: "bold", background: "#3a0202", color: "#d4af37", padding: "4px 10px", borderRadius: "6px" }}>
                    {rewardData.eventDates}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", lineHeight: "1.4" }}>
                  Be part of the BIGGEST sale of the year! 🚀 Earn maximum payouts on every single order, hit your milestones, and kickstart a high-earning journey with us that keeps going well beyond the event!
                </p>
              </div>

              <div style={{ backgroundColor: "#1a0000", border: "2px solid #d4af37", padding: "15px", borderRadius: "12px", textAlign: "center", marginBottom: "25px" }}>
                <p style={{ margin: "0 0 5px 0", color: "#d4af37", fontWeight: "bold", fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "2px" }}>
                  Base Event Surge
                </p>
                <p style={{ fontFamily: "'Teko', sans-serif", margin: 0, fontSize: "4.5rem", color: "#fff", lineHeight: "1" }}>
                  {rewardData.earnings}
                </p>
              </div>

              <div style={{ marginBottom: "25px", padding: "0 5px" }}>
                <h3 style={{ color: "#f8e5a0", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 15px 0", fontSize: "1.1rem", textAlign: "center" }}>
                  🗺️ Your Path to Max Earnings
                </h3>
                <div style={{ position: "relative", paddingLeft: "10px" }}>
                  <div className="road-line"></div>
                  <div style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 1, marginBottom: "20px" }}>
                    <div style={{ width: "28px", height: "28px", backgroundColor: "#3a0202", border: "3px solid #d4af37", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", marginRight: "15px" }}>📦</div>
                    <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", padding: "10px 15px", borderRadius: "8px" }}>
                      <p style={{ margin: 0, color: "#ccc", fontSize: "0.95rem" }}>Per 5 Orders Delivered</p>
                      <p style={{ margin: 0, color: "#a8e6cf", fontFamily: "'Teko', sans-serif", fontSize: "2rem", lineHeight: "1" }}>+{rewardData.perOrderBonus}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}>
                    <div style={{ width: "28px", height: "28px", backgroundColor: "#d4af37", border: "3px solid #fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", marginRight: "15px", boxShadow: "0 0 10px #d4af37" }}>🏆</div>
                    <div style={{ flex: 1, background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.3))", border: "1px solid #d4af37", padding: "10px 15px", borderRadius: "8px" }}>
                      <p style={{ margin: 0, color: "#fff", fontWeight: "bold", fontSize: "0.95rem" }}>Survive the Full Week!</p>
                      <p style={{ margin: 0, color: "#d4af37", fontFamily: "'Teko', sans-serif", fontSize: "2.2rem", lineHeight: "1", textShadow: "1px 1px 0 #000" }}>+{rewardData.continuationBonus}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid #d4af37", background: "rgba(212, 175, 55, 0.05)", padding: "20px", borderRadius: "10px", textAlign: "center", marginBottom: "20px" }}>
                <p style={{ margin: "0 0 8px 0", color: "#d4af37", fontWeight: "bold", fontSize: "1.3rem", letterSpacing: "1px" }}>
                  ⚠️ ACTION REQUIRED
                </p>
                <p style={{ margin: 0, color: "#ddd", fontSize: "1.05rem", lineHeight: "1.4" }}>
                  Claim this offer at the earliest! Enroll yourself today at your nearest <FLogo /> Minutes store before this ticket expires.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}