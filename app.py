
import streamlit as st
import os
import base64
import json
from services.service import analyze_try_on, generate_virtual_try_on_image

# Page Config
st.set_page_config(
    page_title="Fashion Unlimited | Neural Studio",
    page_icon="♾️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Professional CSS Injection
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    
    :root {
        --bg-color: #020617;
        --card-bg: rgba(15, 23, 42, 0.6);
        --accent: #3b82f6;
        --accent-glow: rgba(59, 130, 246, 0.3);
    }

    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
        background-color: var(--bg-color);
        color: #f8fafc;
    }
    
    .stApp { background-color: var(--bg-color); }
    
    .dashboard-card {
        background: var(--card-bg);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 1.5rem;
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
    }

    .technical-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: #64748b;
        margin-bottom: 0.75rem;
        display: block;
    }

    .stButton>button, .stDownloadButton>button {
        width: 100%;
        border-radius: 1rem !important;
        background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
        color: white !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.15em !important;
        padding: 1rem !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    .stButton>button:hover, .stDownloadButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 30px var(--accent-glow);
    }

    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
</style>
""", unsafe_allow_value=True)

# App Header
col_header, col_status = st.columns([2, 1])
with col_header:
    st.markdown("""
        <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 3rem;">
            <div style="background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); padding: 0.75rem; border-radius: 1rem;">
                <span style="font-size: 1.75rem;">♾️</span>
            </div>
            <div>
                <h2 style="margin: 0; font-weight: 800; font-size: 1.5rem;">Fashion Unlimited</h2>
                <p style="margin: 0; font-size: 0.75rem; color: #475569; letter-spacing: 0.1em; text-transform: uppercase;">Neural Synthesis Core v4.1</p>
            </div>
        </div>
    """, unsafe_allow_value=True)

with col_status:
    st.markdown("""
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
            <div style="background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); padding: 0.35rem 1rem; border-radius: 99px; font-size: 0.7rem; font-weight: 800;">
                ● SYSTEM OPERATIONAL
            </div>
        </div>
    """, unsafe_allow_value=True)

# Main Studio Workspace
col_lab, col_canvas = st.columns([1, 1.5], gap="large")

with col_lab:
    st.markdown('<div class="dashboard-card">', unsafe_allow_value=True)
    st.markdown('<span class="technical-label">01 // Subject Acquisition</span>', unsafe_allow_value=True)
    gender = st.radio("Pipeline Mode", ["MEN", "WOMEN"], horizontal=True, label_visibility="collapsed")
    person_img = st.file_uploader("Base Portrait", type=['jpg', 'jpeg', 'png'])

    st.markdown('<div style="margin: 2rem 0; border-top: 1px solid rgba(255,255,255,0.05);"></div>', unsafe_allow_value=True)
    st.markdown('<span class="technical-label">02 // Outfit Assets</span>', unsafe_allow_value=True)
    
    top_img = st.file_uploader("Shirt / Top Asset", type=['jpg', 'jpeg', 'png'])
    bottom_img = st.file_uploader("Pants / Bottom Asset", type=['jpg', 'jpeg', 'png'])
    
    dress_img = None
    if gender == "WOMEN":
        dress_img = st.file_uploader("Dress / One-Piece Asset", type=['jpg', 'jpeg', 'png'])

    if st.button("RUN NEURAL FITTING", disabled=not (person_img and (top_img or bottom_img or dress_img))):
        try:
            def to_b64(f):
                return base64.b64encode(f.getvalue()).decode() if f else None
            
            p_b64 = to_b64(person_img)
            t_b64 = to_b64(top_img)
            b_b64 = to_b64(bottom_img)
            d_b64 = to_b64(dress_img)
            
            with st.status("Synthesizing...", expanded=True) as status:
                analysis = analyze_try_on(p_b64, t_b64, b_b64, d_b64, gender)
                result_img = generate_virtual_try_on_image(
                    p_b64, t_b64, b_b64, d_b64,
                    analysis['technicalPrompt'], 
                    analysis.get('bodySize', 'M'), 
                    gender
                )
                st.session_state.result = {"image": result_img, "analysis": analysis}
                status.update(label="Complete", state="complete")
        except Exception as e:
            st.error(f"Fault: {str(e)}")
    st.markdown('</div>', unsafe_allow_value=True)

with col_canvas:
    tabs = st.tabs(["[ CANVAS ]", "[ TELEMETRY ]"])
    with tabs[0]:
        if "result" in st.session_state and st.session_state.result:
            img_data = st.session_state.result['image']
            st.image(img_data, use_container_width=True)
            b64_str = img_data.split(",")[1]
            st.download_button("💾 DOWNLOAD ASSET", data=base64.b64decode(b64_str), file_name="synthesis.png")
            if st.button("RESET FRAME"):
                st.session_state.result = None
                st.rerun()
        else:
            st.markdown('<div style="height: 500px; display: flex; align-items: center; justify-content: center; opacity: 0.1; font-family: monospace;">AWAITING SIGNAL</div>', unsafe_allow_value=True)
    with tabs[1]:
        if "result" in st.session_state and st.session_state.result:
            st.code(json.dumps(st.session_state.result['analysis'], indent=2), language="json")
